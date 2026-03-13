"use client";

import { useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  type SubmitHandler,
  type UseFormHandleSubmit,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, GripVertical, ExternalLink, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { CategoryFormModal } from "./category-form-modal";
import { ShirtSizesConfig } from "./shirt-sizes-config";
import { KitItemsForm } from "./kit-items-form";
import { KitPickupForm } from "./kit-pickup-form";
import {
  Event,
  EventCategory,
  EventKitItem,
  SportType,
  EventStatus,
  EventFormat,
  EVENT_FORMATS,
} from "@/types/database.types";
import {
  EventFormDataAdmin,
  CategoryFormData,
  EventType,
  ShirtSizesByGender,
  KitItemFormData,
} from "@/types";
import { UserRole } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { GENDER_LABELS } from "@/lib/constants/shirt-sizes";

// Schemas copied from EventForm
const publishSchema = z
  .object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    banner_url: z.string().nullable().optional(),
    location: z.object({
      city: z.string().min(1, "Cidade é obrigatória"),
      state: z.string().min(1, "Estado é obrigatório"),
      venue: z.string().optional(),
      address: z.string().optional(),
      google_maps_url: z.string().optional(),
    }),
    start_date: z.string().min(1, "Data de início é obrigatória"),
    end_date: z.string().nullable().optional(),
    sport_type: z.enum([
      "corrida", "ciclismo", "triatlo", "natacao", "caminhada", "crossfit",
      "beach_sports", "trail_running", "beach_tenis", "futevolei",
      "volei_praia", "stand_up_paddle", "outro",
    ]),
    event_format: z.enum(EVENT_FORMATS),
    status: z.enum(["draft", "published", "published_no_registration", "cancelled", "completed"]),
    event_type: z.enum(["paid", "free", "solidarity"]),
    solidarity_message: z.string().nullable().optional(),
    allows_individual_registration: z.boolean(),
    allows_pair_registration: z.boolean(),
    allows_team_registration: z.boolean(),
    team_size: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      },
      z.number().int().min(2).nullable().optional(),
    ),
    shirt_sizes: z.array(z.string()).optional(),
    shirt_sizes_config: z.any().nullable().optional(),
    max_participants: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      },
      z.number().int().positive().nullable().optional(),
    ),
    registration_start: z.string().nullable().optional(),
    registration_end: z.string().nullable().optional(),
    is_featured: z.boolean(),
    has_organizer: z.boolean(),
    show_course_info: z.boolean(),
    show_championship_format: z.boolean(),
    allow_page_access: z.boolean(),
    has_kit: z.boolean(),
    has_kit_pickup_info: z.boolean(),
    service_fee: z.number().min(0).default(0),
    service_fee_type: z.enum(['percentage', 'fixed']).default('percentage'),
  })
  .refine(
    (data) => {
      if (data.event_type === "solidarity") {
        return data.solidarity_message && data.solidarity_message.trim().length > 0;
      }
      return true;
    },
    { message: "Mensagem solidária é obrigatória para eventos solidários", path: ["solidarity_message"] }
  )
  .refine(
    (data) => {
      if (data.allows_team_registration) {
        return data.team_size !== null && data.team_size !== undefined && data.team_size >= 2;
      }
      return true;
    },
    { message: "Tamanho da equipe é obrigatório (mínimo 2 membros)", path: ["team_size"] }
  );

const WIZARD_STEPS = [
  { id: 'basics', title: 'Informações Básicas' },
  { id: 'location', title: 'Localização' },
  { id: 'dates', title: 'Datas e Inscrições' },
  { id: 'settings', title: 'Configurações e Pagamento' },
  { id: 'identity', title: 'Identidade do Evento' },
  { id: 'categories', title: 'Categorias do Evento' }
];

// Helper to detect Next.js redirect errors (which should not be caught)
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    (error as any).digest.startsWith('NEXT_REDIRECT')
  );
}

interface EventWizardProps {
  event?: Event;
  categories?: EventCategory[];
  kitItems?: EventKitItem[];
  onSubmit: (data: EventFormDataAdmin) => Promise<void>;
  onAutoSaveDraft?: (data: EventFormDataAdmin) => Promise<{ id?: string } | void>;
  onCancel?: () => void;
  onCategoryCreate?: (data: CategoryFormData) => Promise<void>;
  onCategoryUpdate?: (categoryId: string, data: CategoryFormData) => Promise<void>;
  onCategoryDelete?: (categoryId: string) => Promise<void>;
  onCategoryReorder?: (items: { id: string; display_order: number }[]) => Promise<void>;
  kitPickupInfo?: any;
  onKitItemCreate?: (data: KitItemFormData) => Promise<void>;
  onKitItemUpdate?: (id: string, data: KitItemFormData) => Promise<void>;
  onKitItemDelete?: (id: string) => Promise<void>;
  onKitItemsReorder?: (items: { id: string; display_order: number }[]) => Promise<void>;
  onKitPickupInfoUpdate?: (data: any) => Promise<void>;
  userRole?: UserRole;
  initialStep?: number;
}

export function EventWizard({
  event,
  categories = [],
  kitItems = [],
  kitPickupInfo,
  onKitItemCreate,
  onKitItemUpdate,
  onKitItemDelete,
  onKitItemsReorder,
  onKitPickupInfoUpdate,
  onSubmit,
  onAutoSaveDraft,
  onCancel,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onCategoryReorder,
  userRole = 'organizer',
  initialStep = 0,
}: EventWizardProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | undefined>();
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [localCategories, setLocalCategories] = useState<EventCategory[]>(categories);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<EventFormDataAdmin>({
    resolver: zodResolver(publishSchema),
    defaultValues: event
      ? {
        title: event.title,
        description: event.description,
        banner_url: event.banner_url,
        location:
          typeof event.location === "object" && event.location !== null
            ? event.location
            : { city: "", state: "", venue: "", address: "" },
        start_date: event.start_date ? event.start_date.slice(0, 16) : "",
        end_date: event.end_date ? event.end_date.slice(0, 16) : "",
        sport_type: event.sport_type as SportType,
        event_format: event.event_format as EventFormat,
        status: event.status as EventStatus,
        event_type: (event.event_type as EventType) || "paid",
        solidarity_message: event.solidarity_message,
        allows_individual_registration: event.allows_individual_registration !== false,
        allows_pair_registration: event.allows_pair_registration || false,
        allows_team_registration: event.allows_team_registration || false,
        team_size: event.team_size ?? null,
        shirt_sizes: event.shirt_sizes || ["P", "M", "G", "GG", "XG"],
        shirt_sizes_config: event.shirt_sizes_config || null,
        max_participants: event.max_participants,
        registration_start: event.registration_start,
        registration_end: event.registration_end,
        is_featured: event.is_featured || false,
        has_organizer: event.has_organizer !== undefined ? event.has_organizer : true,
        show_course_info: event.show_course_info !== undefined ? event.show_course_info : true,
        show_championship_format: event.show_championship_format !== undefined ? event.show_championship_format : true,
        allow_page_access: event.allow_page_access !== undefined ? event.allow_page_access : true,
        has_kit: event.has_kit !== undefined ? event.has_kit : false,
        has_kit_pickup_info: event.has_kit_pickup_info !== undefined ? event.has_kit_pickup_info : false,
        service_fee: event.service_fee || 0,
        service_fee_type: event.service_fee_type || 'percentage',
      }
      : {
        title: "",
        description: "",
        banner_url: null,
        location: { city: "", state: "", venue: "", address: "", google_maps_url: "" },
        start_date: "",
        end_date: null,
        sport_type: "corrida" as SportType,
        event_format: "presencial" as EventFormat,
        status: "draft" as EventStatus,
        event_type: "paid" as EventType,
        solidarity_message: null,
        allows_individual_registration: true,
        allows_pair_registration: false,
        allows_team_registration: false,
        team_size: null,
        shirt_sizes: ["P", "M", "G", "GG", "XG"],
        shirt_sizes_config: null,
        max_participants: null,
        registration_start: null,
        registration_end: null,
        is_featured: false,
        has_organizer: true,
        show_course_info: true,
        show_championship_format: true,
        allow_page_access: true,
        has_kit: false,
        has_kit_pickup_info: false,
        service_fee: 0,
        service_fee_type: 'percentage',
      },
  });

  // Track if form changed
  useEffect(() => {
    const subscription = watch(() => setHasUnsavedChanges(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  const formatDateTimeForBackend = (datetimeLocal?: string | null) => {
    if (!datetimeLocal) return datetimeLocal;
    return datetimeLocal.includes(':00Z') || datetimeLocal.includes(':00-') || datetimeLocal.includes(':00+')
      ? datetimeLocal
      : `${datetimeLocal}:00`;
  };

  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error, success]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const hasShirtInKit = kitItems.some(
    (item) =>
      item.name.toLowerCase().includes("camiseta") ||
      item.name.toLowerCase().includes("camisa") ||
      item.name.toLowerCase().includes("shirt"),
  );

  const getStepFieldsToValidate = (step: number): string[] => {
    switch (step) {
      case 0: return ['title', 'description', 'sport_type', 'event_format'];
      case 1: return ['location.city', 'location.state'];
      case 2: return ['start_date'];
      case 3:
        const baseFields = ['status', 'event_type'];
        if (watch('event_type') === 'solidarity') baseFields.push('solidarity_message');
        if (watch('allows_team_registration')) baseFields.push('team_size');
        return baseFields;
      case 4: return []; // Identity step - no required validations
      case 5: return []; // Categories - no direct form fields validations
      default: return [];
    }
  };

  const handleNextStep = async () => {
    const fieldsToValidate = getStepFieldsToValidate(currentStepIndex);
    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      // Auto-save draft if possible when progressing, but do not block navigation if it fails just show error
      if (hasUnsavedChanges && onAutoSaveDraft) {
        setIsAutoSaving(true);
        try {
          const formValues = watch();
          await onAutoSaveDraft({
            ...formValues,
            status: formValues.status === 'published' ? 'published' : "draft",
            event_format: formValues.event_format || "presencial",
            start_date: formatDateTimeForBackend(formValues.start_date) as string,
            end_date: formValues.end_date ? formatDateTimeForBackend(formValues.end_date) : null,
            registration_start: formValues.registration_start ? formatDateTimeForBackend(formValues.registration_start) : null,
            registration_end: formValues.registration_end ? formatDateTimeForBackend(formValues.registration_end) : null,
          });
          setHasUnsavedChanges(false);
        } catch (err) {
          if (isRedirectError(err)) throw err;
          console.error("Auto-save failed implicitly", err);
        } finally {
          setIsAutoSaving(false);
        }
      }
      setCurrentStepIndex(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formValues = watch();
      const draftData: EventFormDataAdmin = {
        ...formValues,
        status: "draft" as EventStatus,
        event_format: formValues.event_format || "presencial",
        start_date: formValues.start_date ? formatDateTimeForBackend(formValues.start_date) as string : "",
        end_date: formValues.end_date ? formatDateTimeForBackend(formValues.end_date) : null,
        registration_start: formValues.registration_start ? formatDateTimeForBackend(formValues.registration_start) : null,
        registration_end: formValues.registration_end ? formatDateTimeForBackend(formValues.registration_end) : null,
      };

      // Prefer onAutoSaveDraft for new events (it handles redirect to edit page)
      if (onAutoSaveDraft) {
        await onAutoSaveDraft(draftData);
      } else {
        await onSubmit(draftData);
      }
      setSuccess("Rascunho salvo com sucesso.");
      setHasUnsavedChanges(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      const message = err instanceof Error ? err.message : "Erro ao salvar rascunho. Tente novamente.";
      console.error("Draft save error:", err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForm = handleSubmit as UseFormHandleSubmit<EventFormDataAdmin>;

  const handlePublish = submitForm(
    async (data) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const payload: EventFormDataAdmin = {
          ...data,
          event_format: data.event_format || "presencial",
          start_date: formatDateTimeForBackend(data.start_date) as string,
          end_date: data.end_date ? formatDateTimeForBackend(data.end_date) : null,
          registration_start: data.registration_start ? formatDateTimeForBackend(data.registration_start) : null,
          registration_end: data.registration_end ? formatDateTimeForBackend(data.registration_end) : null,
        };
        await onSubmit(payload);
        const statusMessages: Record<EventStatus, string> = {
          draft: "Rascunho salvo com sucesso.",
          published: "Publicado com sucesso.",
          published_no_registration: "Publicado sem inscrições.",
          pending_approval: "Evento enviado para aprovação.",
          cancelled: "Evento cancelado com sucesso.",
          completed: "Evento marcado como concluído.",
        };
        setSuccess(statusMessages[payload.status] ?? "Evento atualizado com sucesso.");
        setHasUnsavedChanges(false);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        const message = err instanceof Error ? err.message : "Erro ao salvar evento. Tente novamente.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    (validationErrors) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const firstError = Object.values(validationErrors)[0];
      const errorMessage = firstError?.message || (firstError?.root?.message) || "Por favor, preencha todos os campos obrigatórios.";
      setError(typeof errorMessage === 'string' ? errorMessage : "Erro de validação");
    }
  );

  const handleCategorySubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      await onCategoryUpdate?.(editingCategory.id, data);
      setLocalCategories((prev) => prev.map((cat) => cat.id === editingCategory.id ? { ...cat, ...data } : cat));
    } else {
      await onCategoryCreate?.(data);
    }
    setEditingCategory(undefined);
  };

  const handleCategoryDragStart = (index: number) => setDraggedCategoryIndex(index);
  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;
    const newCategories = [...localCategories];
    const draggedCategory = newCategories[draggedCategoryIndex];
    newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(index, 0, draggedCategory);
    const reorderedCategories = newCategories.map((cat, idx) => ({ ...cat, display_order: idx }));
    setLocalCategories(reorderedCategories);
    setDraggedCategoryIndex(index);
    const orderUpdates = reorderedCategories.map((cat) => ({ id: cat.id, display_order: cat.display_order }));
    onCategoryReorder?.(orderUpdates);
  };
  const handleCategoryDragEnd = () => setDraggedCategoryIndex(null);

  const bannerUrl = watch("banner_url");
  const status = watch("status");

  return (
    <div className="space-y-6 pb-32">
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 animate-fade-in">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 animate-fade-in">{success}</div>}

      {/* Stepper Header */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {WIZARD_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (isClickable) {
                    setCurrentStepIndex(index);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                  ${isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isCompleted
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer border border-orange-200'
                      : 'bg-neutral-50 text-neutral-400 cursor-default border border-neutral-100'
                  }
                `}
              >
                <span className={`
                  flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-orange-200 text-orange-700'
                      : 'bg-neutral-200 text-neutral-400'
                  }
                `}>
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className="text-xs font-medium leading-tight truncate">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStepIndex === 0 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">1. Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Título do Evento *</label>
                  <Input {...register("title")} placeholder="Ex: Corrida de São Paulo 2025" error={errors.title?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição *</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Descrição completa do evento"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">Modalidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Esporte *</label>
                  <Select value={watch("sport_type")} onChange={(e) => setValue("sport_type", e.target.value as SportType)}>
                    <option value="corrida">Corrida</option>
                    <option value="ciclismo">Ciclismo</option>
                    <option value="triatlo">Triatlo</option>
                    <option value="natacao">Natação</option>
                    <option value="caminhada">Caminhada</option>
                    <option value="crossfit">CrossFit</option>
                    <option value="beach_sports">Beach Sports</option>
                    <option value="beach_tenis">Beach Tennis</option>
                    <option value="futevolei">Futevôlei</option>
                    <option value="volei_praia">Vôlei de Praia</option>
                    <option value="stand_up_paddle">Stand Up Paddle</option>
                    <option value="trail_running">Trail Running</option>
                    <option value="outro">Outro</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Formato do Evento *</label>
                  <Select value={watch("event_format")} onChange={(e) => setValue("event_format", e.target.value as EventFormat)}>
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                    <option value="workshop">Workshop</option>
                    <option value="hibrido">Híbrido</option>
                  </Select>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStepIndex === 1 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">2. Localização</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Cidade *</label>
                  <Input {...register("location.city")} placeholder="Ex: São Paulo" error={errors.location?.city?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Estado *</label>
                  <Input {...register("location.state")} placeholder="Ex: SP" error={errors.location?.state?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Local</label>
                  <Input {...register("location.venue")} placeholder="Ex: Parque Ibirapuera" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Endereço</label>
                  <Input {...register("location.address")} placeholder="Ex: Av. Pedro Álvares Cabral" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Link Google Maps</label>
                  <Input {...register("location.google_maps_url")} placeholder="Ex: https://maps.google.com/..." />
                  <p className="text-xs text-neutral-500 mt-1">Cole o link do Google Maps para o local do evento</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStepIndex === 2 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">3. Datas e Inscrições</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Data de Início do Evento *</label>
                  <Input type="datetime-local" {...register("start_date")} error={errors.start_date?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Data de Término do Evento</label>
                  <Input type="datetime-local" {...register("end_date")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-neutral-100">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Início das Inscrições</label>
                  <Input type="datetime-local" {...register("registration_start")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fim das Inscrições</label>
                  <Input type="datetime-local" {...register("registration_end")} />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Vagas Máximas (Total)</label>
                <Input
                  type="number"
                  {...register("max_participants", {
                    setValueAs: (v) => {
                      if (!v || v === "") return null;
                      const parsed = parseInt(v, 10);
                      return isNaN(parsed) ? null : parsed;
                    },
                  })}
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                  className="md:w-1/2"
                />
              </div>
            </Card>
          </div>
        )}

        {currentStepIndex === 3 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">4. Configurações e Pagamento</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status de Visibilidade *</label>
                  <Select className="md:w-1/2" {...register("status")}>
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="published_no_registration">Publicado - sem inscrições</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="completed">Concluído</option>
                  </Select>
                </div>

                {status === "published_no_registration" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="allow_page_access"
                        {...register("allow_page_access")}
                        className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                      />
                      <div>
                        <label htmlFor="allow_page_access" className="text-sm font-medium text-amber-900 cursor-pointer">
                          Permitir acesso à página do evento?
                        </label>
                        <p className="text-xs text-amber-700 mt-1">
                          Se desmarcado, exibirá "Em breve" e a página não estará acessível.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Pagamento do Evento *</label>
                  <Select className="md:w-1/2" {...register("event_type")}>
                    <option value="paid">Pago - Requer pagamento</option>
                    <option value="free">Gratuito - Inscrição sem pagamento</option>
                    <option value="solidarity">Solidário - Requisito (ex: doação)</option>
                  </Select>
                </div>

                {watch("event_type") === "solidarity" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Mensagem Solidária *</label>
                    <textarea
                      {...register("solidarity_message")}
                      rows={3}
                      placeholder="Ex: Inscrição mediante a doação de 1kg de alimento no dia do evento"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                    {errors.solidarity_message && <p className="mt-1 text-sm text-red-600">{errors.solidarity_message.message}</p>}
                    <p className="mt-1 text-xs text-neutral-500">Exibida para os usuários durante a inscrição</p>
                  </div>
                )}

                {userRole === 'admin' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Serviço</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="percentage" {...register("service_fee_type")} className="h-4 w-4 text-orange-600 focus:ring-orange-500" />
                          <span className="text-sm text-gray-700">Porcentagem (%)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="fixed" {...register("service_fee_type")} className="h-4 w-4 text-orange-600 focus:ring-orange-500" />
                          <span className="text-sm text-gray-700">Valor Fixo (R$)</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-32"
                          {...register("service_fee", { setValueAs: (v) => v === "" ? 0 : Number(v) })}
                        />
                        <span className="text-sm text-gray-500">{watch("service_fee_type") === 'percentage' ? '%' : 'R$'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tipos de Equipe Permitidas</label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="registration_individual" {...register("allows_individual_registration")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                      <span className="text-sm text-neutral-700">Individual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="registration_pair" {...register("allows_pair_registration")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                      <span className="text-sm text-neutral-700">Em dupla</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="registration_team" {...register("allows_team_registration")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                      <span className="text-sm text-neutral-700">Em equipe</span>
                    </label>
                  </div>
                </div>

                {watch("allows_team_registration") && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:w-1/2">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Tamanho da equipe *</label>
                    <Input
                      type="number"
                      {...register("team_size", {
                        setValueAs: (v) => {
                          if (!v || v === "") return null;
                          const parsed = parseInt(v, 10);
                          return isNaN(parsed) ? null : parsed;
                        },
                      })}
                      placeholder="Número de membros"
                      min="2"
                      error={errors.team_size?.message}
                    />
                    {errors.team_size && <p className="mt-1 text-sm text-red-600">{errors.team_size.message}</p>}
                  </div>
                )}
                
                {/* Outras Configs de Exibição */}
                <div className="space-y-3 pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Exibição na Página do Evento</h4>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_featured" {...register("is_featured")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                    <label htmlFor="is_featured" className="text-sm text-neutral-700">Evento em destaque</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="has_organizer" {...register("has_organizer")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                    <label htmlFor="has_organizer" className="text-sm text-neutral-700">Exibir informações do organizador</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="show_course_info" {...register("show_course_info")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                    <label htmlFor="show_course_info" className="text-sm text-neutral-700">Exibir seção de percurso</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="show_championship_format" {...register("show_championship_format")} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded" />
                    <label htmlFor="show_championship_format" className="text-sm text-neutral-700">Exibir seção de formato do campeonato</label>
                  </div>
                </div>

              </div>
            </Card>

            <Card className="p-6">
               <h3 className="text-lg font-semibold mb-4 text-neutral-900">Kit do Atleta</h3>
               <div className="flex items-start gap-3 mb-6">
                <input
                  type="checkbox"
                  id="has_kit"
                  {...register("has_kit")}
                  className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                />
                <div>
                  <label htmlFor="has_kit" className="text-sm font-medium text-neutral-700 cursor-pointer">
                    O evento possuí um kit para o atleta?
                  </label>
                  <p className="text-xs text-neutral-500 mt-1">
                    Habilite esta opção para configurar itens como camiseta, chip, etc.
                  </p>
                </div>
              </div>

              {watch("has_kit") && event?.id && (
                <div className="space-y-6">
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <KitItemsForm
                      eventId={event?.id || ""}
                      items={kitItems}
                      onCreate={onKitItemCreate || (async () => { })}
                      onUpdate={onKitItemUpdate || (async () => { })}
                      onDelete={onKitItemDelete || (async () => { })}
                      onReorder={onKitItemsReorder || (async () => { })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="has_kit_pickup_info" {...register("has_kit_pickup_info")} className="mt-1 h-4 w-4 text-orange-600" />
                      <div>
                        <label htmlFor="has_kit_pickup_info" className="text-sm font-medium text-neutral-700">Informações de retirada do Kit?</label>
                      </div>
                    </div>
                    {watch("has_kit_pickup_info") && (
                      <div className="pl-7">
                        <KitPickupForm pickupInfo={kitPickupInfo} onPickupInfoUpdate={onKitPickupInfoUpdate || (async () => { })} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {watch("has_kit") && !event?.id && (
                <p className="text-sm text-amber-600">Salve o evento como rascunho primeiro para habilitar o painel de itens do kit.</p>
              )}
            </Card>
            
            {watch("has_kit") && hasShirtInKit && (
              <ShirtSizesConfig
                config={watch("shirt_sizes_config") as ShirtSizesByGender | null}
                onChange={(config) => setValue("shirt_sizes_config", config)}
                error={errors.shirt_sizes_config?.message}
              />
            )}
          </div>
        )}

        {currentStepIndex === 4 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900">5. Identidade do Evento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Banner do Evento</label>
                  {event?.id || event?.slug ? (
                    <>
                      <FileUpload
                        bucket="event-banners"
                        folder={event?.id || event?.slug || undefined}
                        value={bannerUrl || undefined}
                        onChange={(url) => setValue("banner_url", url)}
                        compress={true}
                        showPreview={true}
                        placeholder="Arraste uma imagem ou clique para selecionar"
                      />
                      <p className="text-xs text-neutral-500 mt-2">Imagem principal que aparecerá na página e nos cards do evento</p>
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-amber-600 mb-3">⚠️ Salve o evento como rascunho para habilitar o upload do banner.</p>
                      <Button type="button" size="sm" onClick={handleSaveDraft} disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Salvar Rascunho agora"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStepIndex === 5 && (
          <div className="space-y-6 animate-fade-in">
            {event ? (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">6. Categorias do Evento</h3>
                    {localCategories.length > 1 && <p className="text-sm text-neutral-500 mt-1">Arraste para reordenar</p>}
                  </div>
                  <Button type="button" size="sm" onClick={() => { setEditingCategory(undefined); setCategoryModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Categoria
                  </Button>
                </div>

                {localCategories.length > 0 ? (
                  <div className="space-y-2">
                    {localCategories.map((category, index) => (
                      <div
                        key={category.id}
                        draggable
                        onDragStart={() => handleCategoryDragStart(index)}
                        onDragOver={(e) => handleCategoryDragOver(e, index)}
                        onDragEnd={handleCategoryDragEnd}
                        className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-move hover:bg-neutral-100 transition"
                      >
                        <GripVertical className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{category.name}</p>
                            {category.shirt_genders?.map((gender) => (
                              <Badge key={gender} variant="info" className="text-xs">{GENDER_LABELS[gender]}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-neutral-600">
                            {formatCurrency(category.price)} • {category.max_participants ? `${category.max_participants} vagas` : "Ilimitado"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingCategory(category); setCategoryModalOpen(true); }}>
                            Editar
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => onCategoryDelete?.(category.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                    <p className="text-neutral-500 text-sm mb-4">Nenhuma categoria criada ainda.</p>
                    <Button type="button" variant="outline" onClick={() => { setEditingCategory(undefined); setCategoryModalOpen(true); }}>
                      Criar Primeira Categoria
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Save className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Salve o evento primeiro</h3>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Para criar categorias, o evento precisa estar salvo como rascunho no sistema. Clique no botão abaixo para salvar agora.
                </p>
                <Button onClick={handleSaveDraft} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Evento agora"}
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons Fixed at bottom */}
      <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
        <div className="pointer-events-auto border-t border-neutral-200 bg-white/90 backdrop-blur-xl shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-between">
            <div>
              {currentStepIndex > 0 ? (
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => onCancel ? onCancel() : router.push("/admin/eventos")} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAutoSaving && <span className="text-xs text-neutral-500 hidden sm:inline-block">Salvando rascunho...</span>}
              {event?.slug && (
                <Button type="button" variant="outline" size="sm" onClick={() => window.open(`/eventos/${event.slug}`, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver Página
                </Button>
              )}
              {/* Show "Salvar Rascunho" only when título is filled (minimum required for draft) */}
              {watch("title")?.trim() ? (
                <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Rascunho"}
                </Button>
              ) : (
                <span className="text-xs text-neutral-400 hidden sm:inline-block max-w-[140px] text-right leading-tight">
                  Preencha o título para salvar
                </span>
              )}
              
              {currentStepIndex < WIZARD_STEPS.length - 1 ? (
                <Button type="button" onClick={handleNextStep} disabled={isSubmitting}>
                  Próxima Etapa
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handlePublish} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                  {status === "published" ? "Atualizar Evento" : "Publicar Evento"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        onClose={() => { setCategoryModalOpen(false); setEditingCategory(undefined); }}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        eventType={watch("event_type")}
        kitItems={kitItems}
      />
    </div>
  );
}
