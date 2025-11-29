import { LegalLayout } from '@/components/layout/legal-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Reembolso | SymplePass',
    description: 'Política de Reembolso da SymplePass. Regras para cancelamentos e devoluções.',
}

export default function RefundPage() {
    return (
        <LegalLayout title="Política de Reembolso">
            <h3>1. Natureza da Intermediação</h3>
            <p>
                A SymplePass atua, na maioria dos casos, como intermediadora tecnológica entre Organizadores e Atletas.
                Assim, as regras de devolução podem variar conforme o Evento, sendo definidas pelo Organizador responsável.
                Nos eventos organizados diretamente pela SymplePass, aplicam-se as regras próprias desta Política (ver item 4).
            </p>

            <h3>2. Cancelamentos e Reembolsos de Eventos de Terceiros</h3>

            <h4>2.1. Responsabilidade do Organizador</h4>
            <p>O prazo, valores e condições para cancelamento e reembolso são definidos exclusivamente pelo Organizador do Evento.</p>

            <h4>2.2. Disponibilização das regras</h4>
            <p>As políticas de cancelamento de cada Evento são apresentadas na página da inscrição antes da compra e fazem parte das condições do serviço contratado.</p>

            <h4>2.3. Processamento pela SymplePass</h4>
            <p>O SymplePass poderá intermediar o processo técnico do reembolso (quando permitido pelo Organizador), mas não tem autonomia para autorizar devoluções.</p>

            <h4>2.4. Eventos cancelados ou alterados</h4>
            <p>Em caso de:</p>
            <ul>
                <li>cancelamento,</li>
                <li>adiamento,</li>
                <li>mudança de local ou data,</li>
            </ul>
            <p>a responsabilidade pela definição de compensações, créditos ou reembolsos é do Organizador.</p>

            <h4>2.5. Taxas de serviço</h4>
            <p>As taxas de serviço cobradas pela SymplePass, quando aplicáveis, podem não ser reembolsáveis, exceto quando o Evento for cancelado pelo Organizador antes de sua realização.</p>

            <h3>3. Direito de Arrependimento (CDC)</h3>
            <p>
                Conforme o Código de Defesa do Consumidor, o Atleta poderá exercer o direito de arrependimento em até 7 dias corridos após a compra somente quando a inscrição for realizada pela internet e desde que o Evento ainda não tenha ocorrido nem serviços relacionados tenham sido consumidos.
            </p>
            <p>Após esse período, aplicam-se integralmente as regras do Organizador.</p>

            <h3>4. Devoluções para Eventos Organizados pela SymplePass</h3>
            <p>Para eventos produzidos diretamente pela SymplePass, aplicam-se as seguintes regras:</p>

            <h4>4.1. Cancelamento pelo Participante</h4>
            <ul>
                <li>Até 30 dias antes do evento: reembolso de 70% do valor pago.</li>
                <li>Entre 29 e 10 dias antes: reembolso de 50%.</li>
                <li>Nos últimos 9 dias: não há reembolso, mas pode ser oferecida transferência de titularidade, quando disponível.</li>
            </ul>

            <h4>4.2. Cancelamento pelo próprio evento (por decisão da SymplePass)</h4>
            <p>Se o evento for cancelado, o Atleta poderá escolher entre:</p>
            <ol type="a">
                <li>reembolso integral do valor pago pela inscrição; ou</li>
                <li>crédito para outro evento próprio da SymplePass.</li>
            </ol>

            <h4>4.3. Adiamentos e alterações importantes</h4>
            <p>Se houver mudança significativa (ex.: nova data ou local), o Atleta poderá solicitar reembolso integral caso não possa participar.</p>

            <h4>4.4. Taxas de serviço e administrativas</h4>
            <p>Nos eventos próprios da SymplePass, o reembolso inclui todas as taxas, exceto se o cancelamento ocorrer por pedido do participante dentro dos prazos previstos no item 4.1.</p>

            <h3>5. Formas e Prazos de Reembolso</h3>
            <p>5.1. Os reembolsos serão realizados pelo mesmo método de pagamento utilizado na compra, sempre que tecnicamente possível.</p>
            <p>5.2. Os prazos podem variar conforme bandeira de cartão, operadora de pagamento ou política bancária, podendo levar até 30 dias após a aprovação do Organizador ou da SymplePass.</p>
            <p>5.3. Em casos de pagamento via boleto ou Pix, o Usuário deverá informar seus dados bancários para depósito.</p>

            <h3>6. Transferência de Inscrição</h3>
            <p>
                Sempre que o Organizador permitir, a inscrição poderá ser transferida para outro participante até a data limite definida pelo Evento.
                A SymplePass apenas viabiliza tecnicamente a transferência quando habilitada pelo Organizador.
            </p>

            <h3>7. Contato</h3>
            <p>Para dúvidas ou solicitações relacionadas a devoluções:</p>
            <p><strong>E-mail:</strong> contato@symplepass.com.br</p>
            <p><strong>Assunto:</strong> “Cancelamento/Reembolso – [Nome do Evento]”</p>
        </LegalLayout>
    )
}
