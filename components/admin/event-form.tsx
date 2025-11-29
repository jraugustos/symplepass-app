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
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { CategoryFormModal } from "./category-form-modal";
import { ShirtSizesConfig } from "./shirt-sizes-config";
import {
  Event,
  EventCategory,
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
} from "@/types";
import { formatCurrency } from "@/lib/utils";

// Schema for publishing - all validations
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
    }),
    start_date: z.string().min(1, "Data de início é obrigatória"),
    end_date: z.string().nullable().optional(),
    sport_type: z.enum([
      "corrida",
      "ciclismo",
      "triatlo",
      "natacao",
      "caminhada",
      "crossfit",
      "beach_sports",
      "trail_running",
      "beach_tenis",
      "futevolei",
      "volei_praia",
      "stand_up_paddle",
      "outro",
    ]),
    event_format: z.enum(EVENT_FORMATS),
    status: z.enum(["draft", "published", "published_no_registration", "cancelled", "completed"]),
    event_type: z.enum(["paid", "free", "solidarity"]),
    solidarity_message: z.string().nullable().optional(),
    allows_pair_registration: z.boolean(),
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
  })
  .refine(
    (data) => {
      // Solidarity message is required when event_type is 'solidarity'
      if (data.event_type === "solidarity") {
        return (
          data.solidarity_message && data.solidarity_message.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "Mensagem solidária é obrigatória para eventos solidários",
      path: ["solidarity_message"],
    },
  );

// Schema for drafts - minimal validation
const draftSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  banner_url: z.string().nullable().optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      venue: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
  sport_type: z
    .enum([
      "corrida",
      "ciclismo",
      "triatlo",
      "natacao",
      "caminhada",
      "crossfit",
      "beach_sports",
      "trail_running",
      "beach_tenis",
      "futevolei",
      "volei_praia",
      "stand_up_paddle",
      "outro",
    ])
    .optional(),
  event_format: z.enum(EVENT_FORMATS).optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  event_type: z.enum(["paid", "free", "solidarity"]).optional(),
  solidarity_message: z.string().nullable().optional(),
  allows_pair_registration: z.boolean().optional(),
  shirt_sizes: z.array(z.string()).optional(),
  shirt_sizes_config: z.any().nullable().optional(),
  max_participants: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().positive().nullable().optional(),
  ),
  registration_start: z.string().nullable().optional(),
  registration_end: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  has_organizer: z.boolean().optional(),
  show_course_info: z.boolean().optional(),
  show_championship_format: z.boolean().optional(),
});

interface EventFormProps {
  event?: Event;
  categories?: EventCategory[];
  kitItems?: Array<{ id: string; name: string;[key: string]: any }>;
  onSubmit: (data: EventFormDataAdmin) => Promise<void>;
  onCancel?: () => void;
  onCategoryCreate?: (data: CategoryFormData) => Promise<void>;
  onCategoryUpdate?: (
    categoryId: string,
    data: CategoryFormData,
  ) => Promise<void>;
  onCategoryDelete?: (categoryId: string) => Promise<void>;
  eventDetailsSection?: ReactNode;
}

export function EventForm({
  event,
  categories = [],
  kitItems = [],
  onSubmit,
  onCancel,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  eventDetailsSection,
}: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    EventCategory | undefined
  >();
  const [registrationTypes, setRegistrationTypes] = useState<{ individual: boolean; pair: boolean }>({
    individual: true,
    pair: event?.allows_pair_registration || false
  });

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
        allows_pair_registration: event.allows_pair_registration || false,
        shirt_sizes: event.shirt_sizes || ["P", "M", "G", "GG", "XG"],
        shirt_sizes_config: event.shirt_sizes_config || null,
        max_participants: event.max_participants,
        registration_start: event.registration_start,
        registration_end: event.registration_end,
        is_featured: event.is_featured || false,
        has_organizer:
          event.has_organizer !== undefined ? event.has_organizer : true,
        show_course_info:
          event.show_course_info !== undefined ? event.show_course_info : true,
        show_championship_format:
          event.show_championship_format !== undefined ? event.show_championship_format : true,
      }
      : {
        title: "",
        description: "",
        banner_url: null,
        location: { city: "", state: "", venue: "", address: "" },
        start_date: "",
        end_date: null,
        sport_type: "corrida" as SportType,
        event_format: "presencial" as EventFormat,
        status: "draft" as EventStatus,
        event_type: "paid" as EventType,
        solidarity_message: null,
        allows_pair_registration: false,
        shirt_sizes: ["P", "M", "G", "GG", "XG"],
        shirt_sizes_config: null,
        max_participants: null,
        registration_start: null,
        registration_end: null,
        is_featured: false,
        has_organizer: true,
        show_course_info: true,
        show_championship_format: true,
      },
  });

  const submitForm = handleSubmit as UseFormHandleSubmit<EventFormDataAdmin>;

  // Removida função convertToBrazilTimezone que causava bug de horário
  // Agora preservamos o valor exato selecionado pelo usuário
  const formatDateTimeForBackend = (datetimeLocal?: string | null) => {
    if (!datetimeLocal) return datetimeLocal;
    // Adiciona segundos se não estiverem presentes
    // O backend espera formato ISO 8601 completo
    return datetimeLocal.includes(':00Z') || datetimeLocal.includes(':00-') || datetimeLocal.includes(':00+')
      ? datetimeLocal
      : `${datetimeLocal}:00`;
  };

  // Auto-scroll para o topo quando houver mensagem
  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error, success]);

  // Auto-dismiss para mensagens de sucesso após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Sincroniza o estado de registrationTypes com o campo allows_pair_registration
  useEffect(() => {
    setValue("allows_pair_registration", registrationTypes.pair);
  }, [registrationTypes, setValue]);

  // Note: shirt_sizes field is kept for backward compatibility
  // but shirt_sizes_config is now the primary source for gender-based sizes

  // Check if there's a shirt/camiseta item in kit
  const hasShirtInKit = kitItems.some(
    (item) =>
      item.name.toLowerCase().includes("camiseta") ||
      item.name.toLowerCase().includes("camisa") ||
      item.name.toLowerCase().includes("shirt"),
  );

  // Draft save - bypass validation
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current form values without validation
      const formValues = watch();
      await onSubmit({
        ...formValues,
        status: "draft" as EventStatus,
        event_format: formValues.event_format || "presencial",
        start_date: formatDateTimeForBackend(formValues.start_date) as string,
        end_date: formValues.end_date
          ? formatDateTimeForBackend(formValues.end_date)
          : null,
        registration_start: formValues.registration_start
          ? formatDateTimeForBackend(formValues.registration_start)
          : null,
        registration_end: formValues.registration_end
          ? formatDateTimeForBackend(formValues.registration_end)
          : null,
      });
      setSuccess("Rascunho salvo com sucesso.");
    } catch (err) {
      setError("Erro ao salvar rascunho. Tente novamente.");
      console.error("Error saving draft:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish - with full validation
  const handlePublish = submitForm((data) =>
    handleFormSubmit(data),
  );

  const bannerUrl = watch("banner_url");
  const status = watch("status");

  const handleFormSubmit: SubmitHandler<EventFormDataAdmin> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: EventFormDataAdmin = {
        ...data,
        event_format: data.event_format || "presencial",
        start_date: formatDateTimeForBackend(data.start_date) as string,
        end_date: data.end_date ? formatDateTimeForBackend(data.end_date) : null,
        registration_start: data.registration_start
          ? formatDateTimeForBackend(data.registration_start)
          : null,
        registration_end: data.registration_end
          ? formatDateTimeForBackend(data.registration_end)
          : null,
      };
      await onSubmit(payload);
      const statusMessages: Record<EventStatus, string> = {
        draft: "Rascunho salvo com sucesso.",
        published: "Publicado com sucesso.",
        published_no_registration: "Publicado sem inscrições.",
        cancelled: "Evento cancelado com sucesso.",
        completed: "Evento marcado como concluído.",
      };
      setSuccess(statusMessages[payload.status] ?? "Evento atualizado com sucesso.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao salvar evento. Tente novamente.";
      setError(message);
      console.error("Error submitting event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      await onCategoryUpdate?.(editingCategory.id, data);
    } else {
      await onCategoryCreate?.(data);
    }
    setEditingCategory(undefined);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Feedbacks no topo para melhor visibilidade */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 animate-fade-in">
          {success}
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Título do Evento *
            </label>
            <Input
              {...register("title")}
              placeholder="Ex: Corrida de São Paulo 2025"
              error={errors.title?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descrição *
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Descrição completa do evento"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Banner do Evento
            </label>
            <FileUpload
              bucket="event-banners"
              folder={event?.id || event?.slug || ''}
              disabled={!event?.id && !event?.slug}
              value={bannerUrl || undefined}
              onChange={(url) => setValue("banner_url", url)}
              compress={true}
              showPreview={true}
              placeholder="Arraste uma imagem ou clique para selecionar"
            />
            {!event?.id && !event?.slug && (
              <p className="text-sm text-gray-600 mt-2">
                💡 Salve o evento como rascunho primeiro para habilitar o upload do banner
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Localização</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cidade *
            </label>
            <Input
              {...register("location.city")}
              placeholder="Ex: São Paulo"
              error={errors.location?.city?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Estado *
            </label>
            <Input
              {...register("location.state")}
              placeholder="Ex: SP"
              error={errors.location?.state?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Local
            </label>
            <Input
              {...register("location.venue")}
              placeholder="Ex: Parque Ibirapuera"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Endereço
            </label>
            <Input
              {...register("location.address")}
              placeholder="Ex: Av. Pedro Álvares Cabral"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Datas e Configurações</h3>

        <div className="space-y-4">
          {/* Status - Full width at top */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status *
            </label>
            <Select {...register("status")}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="published_no_registration">Publicado - sem inscrições</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </Select>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Data de Início *
              </label>
              <Input
                type="datetime-local"
                {...register("start_date")}
                error={errors.start_date?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Data de Término
              </label>
              <Input type="datetime-local" {...register("end_date")} />
            </div>
          </div>

          {/* Sport and Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo de Esporte *
              </label>
              <Select
                value={watch("sport_type")}
                onChange={(e) =>
                  setValue("sport_type", e.target.value as SportType)
                }
              >
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Formato do Evento *
              </label>
              <Select
                value={watch("event_format")}
                onChange={(e) =>
                  setValue("event_format", e.target.value as EventFormat)
                }
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="workshop">Workshop</option>
                <option value="hibrido">Híbrido</option>
              </Select>
            </div>
          </div>

          {/* Configurações de Pagamento e Inscrição */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo de Evento *
                </label>
                <Select {...register("event_type")}>
                  <option value="paid">Pago - Requer pagamento via Stripe</option>
                  <option value="free">Gratuito - Inscrição sem pagamento</option>
                  <option value="solidarity">Solidário - Inscrição com requisito (ex: doação)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Vagas Máximas
                </label>
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
                />
              </div>
            </div>

            {watch("event_type") === "solidarity" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Mensagem Solidária *
                </label>
                <textarea
                  {...register("solidarity_message")}
                  rows={3}
                  placeholder="Ex: Inscrição mediante a doação de 1kg de alimento no dia do evento"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
                {errors.solidarity_message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.solidarity_message.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  Esta mensagem será exibida para os usuários durante a inscrição
                </p>
              </div>
            )}
          </div>

          {/* Tipo de Inscrição */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tipo de inscrição permitida
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="registration_individual"
                  checked={registrationTypes.individual}
                  onChange={(e) => setRegistrationTypes(prev => ({ ...prev, individual: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="registration_pair"
                  checked={registrationTypes.pair}
                  onChange={(e) => setRegistrationTypes(prev => ({ ...prev, pair: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">Em dupla</span>
              </label>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Selecione os tipos de inscrição permitidos para este evento
            </p>
          </div>

          {/* Configurações de Exibição */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                {...register("is_featured")}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
              />
              <label htmlFor="is_featured" className="text-sm text-neutral-700">
                Evento em destaque
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_organizer"
                {...register("has_organizer")}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
              />
              <label htmlFor="has_organizer" className="text-sm text-neutral-700">
                Exibir informações do organizador
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show_course_info"
                {...register("show_course_info")}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
              />
              <label htmlFor="show_course_info" className="text-sm text-neutral-700">
                Exibir seção de percurso na página do evento
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show_championship_format"
                {...register("show_championship_format")}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-neutral-300 rounded"
              />
              <label htmlFor="show_championship_format" className="text-sm text-neutral-700">
                Exibir seção de formato do campeonato na página do evento
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Categorias Section */}
      {event && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Categorias</h3>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingCategory(undefined);
                setCategoryModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Categoria
            </Button>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-neutral-600">
                      {formatCurrency(category.price)} •{" "}
                      {category.max_participants
                        ? `${category.max_participants} vagas`
                        : "Ilimitado"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onCategoryDelete?.(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">
              Nenhuma categoria criada ainda.
            </p>
          )}
        </Card>
      )}

      {eventDetailsSection}

      {/* Shirt Sizes Config - Only show if there's a shirt in kit or if it's a new event */}
      {(hasShirtInKit || kitItems.length === 0) && (
        <ShirtSizesConfig
          config={watch("shirt_sizes_config") as ShirtSizesByGender | null}
          onChange={(config) => setValue("shirt_sizes_config", config)}
          error={errors.shirt_sizes_config?.message}
        />
      )}

      {/* Info message if no shirt in kit */}
      {!hasShirtInKit && kitItems.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Tamanhos de camiseta não disponíveis
              </h3>
              <p className="text-sm text-blue-800">
                Para configurar os tamanhos de camiseta, primeiro adicione o
                item "Camiseta" na aba "Detalhes do Evento" → "Kit do Atleta".
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Spacer before action buttons */}
      <div className="pt-8 border-t border-neutral-200" />

      {/* Action Buttons - Fixed at bottom */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="pointer-events-auto border-t border-neutral-200 bg-white/70 backdrop-blur-xl shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onCancel ? onCancel() : router.push("/admin/eventos")
                }
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
              >
                {isSubmitting ? "Salvando..." : "Salvar como Rascunho"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handlePublish}
              >
                {isSubmitting
                  ? (status === "published" ? "Atualizando..." : "Publicando...")
                  : (status === "published" ? "Atualizar" : "Publicar")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(undefined);
        }}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        eventType={watch("event_type")}
      />
    </div>
  );
}
