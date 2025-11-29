import { LegalLayout } from '@/components/layout/legal-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Termos de Uso | SymplePass',
    description: 'Termos de Uso da SymplePass. Regras e condições para utilização da plataforma.',
}

export default function TermsPage() {
    return (
        <LegalLayout title="Termos de Uso" lastUpdated="28/6/2025">
            <p>
                Bem-vindo(a) ao SymplePass. Estes Termos de Uso regulam o acesso e o uso da nossa plataforma, que conecta organizadores de eventos esportivos a atletas, oferecendo ferramentas de divulgação, inscrição e gestão de eventos. Ao utilizar nossos serviços, você concorda integralmente com estes Termos.
            </p>
            <p>
                Caso você não concorde com alguma das condições abaixo, solicitamos que não utilize a plataforma.
            </p>

            <h3>1. Definições</h3>
            <ul>
                <li><strong>Plataforma:</strong> sistema online SymplePass, incluindo site, aplicativos e serviços associados.</li>
                <li><strong>Usuário:</strong> qualquer pessoa que acesse ou utilize a plataforma, incluindo atletas e organizadores.</li>
                <li><strong>Organizador:</strong> pessoa física ou jurídica responsável pela criação, gestão e realização de eventos esportivos.</li>
                <li><strong>Atleta:</strong> usuário que realiza inscrições em eventos divulgados na plataforma.</li>
                <li><strong>Evento:</strong> atividade esportiva cadastrada por um Organizador no SymplePass.</li>
            </ul>

            <h3>2. Sobre o SymplePass</h3>
            <p>O SymplePass funciona como um intermediário tecnológico que:</p>
            <ol type="a">
                <li>disponibiliza ferramentas para que Organizadores divulguem e gerenciem seus eventos;</li>
                <li>permite que Atletas realizem inscrições e pagamentos;</li>
                <li>facilita a comunicação entre Organizadores e Atletas.</li>
            </ol>
            <p>
                Embora a maior parte dos eventos listados na plataforma seja organizada por terceiros, o SymplePass poderá, ocasionalmente, produzir, organizar ou coorganizar eventos esportivos próprios.
            </p>
            <p>
                Nos eventos realizados diretamente pelo SymplePass, as responsabilidades, regras e políticas específicas serão claramente informadas na página do Evento e nos materiais oficiais relacionados.
            </p>
            <p>
                Para todos os demais Eventos cadastrados por Organizadores externos, o SymplePass não organiza, produz ou gerencia a execução das atividades, sendo cada Evento de total responsabilidade de seu respectivo Organizador.
            </p>

            <h3>3. Cadastro e Conta do Usuário</h3>
            <p>3.1. Para utilizar a plataforma, o Usuário deve fornecer informações verdadeiras, atualizadas e completas.</p>
            <p>3.2. O Usuário é responsável por manter a confidencialidade de seu login e senha.</p>
            <p>3.3. O SymplePass pode suspender ou cancelar contas em caso de:</p>
            <ul>
                <li>violação destes Termos;</li>
                <li>informações falsas;</li>
                <li>uso indevido da plataforma.</li>
            </ul>

            <h3>4. Inscrições e Pagamentos</h3>
            <p>4.1. As inscrições são processadas pela plataforma em nome dos Organizadores.</p>
            <p>4.2. O valor e as condições de participação são definidos exclusivamente pelos Organizadores.</p>
            <p>4.3. O SymplePass pode cobrar taxas de serviço, quando aplicável, exibidas antes da confirmação da inscrição.</p>
            <p>4.4. Confirmações, comprovantes e comunicações sobre o Evento são enviados ao Usuário via plataforma e/ou e-mail.
            </p>

            <h3>5. Cancelamentos, Reembolsos e Alterações</h3>
            <p>5.1. A política de cancelamento e reembolso é estabelecida pelo Organizador do Evento.</p>
            <p>5.2. O SymplePass poderá intermediar o processo, mas não é responsável por devoluções que dependam de aprovação do Organizador.</p>
            <p>5.3. Caso um Evento seja cancelado, adiado ou modificado, a responsabilidade pela comunicação aos Atletas é do Organizador.</p>

            <h3>6. Responsabilidades</h3>
            <h4>6.1. Responsabilidades do SymplePass</h4>
            <ul>
                <li>Disponibilizar uma plataforma estável, segura e funcional.</li>
                <li>Processar inscrições e pagamentos de forma transparente.</li>
                <li>Proteger os dados dos Usuários conforme a legislação vigente.</li>
            </ul>
            <h4>6.2. Limitações de Responsabilidade</h4>
            <p>O SymplePass não se responsabiliza por:</p>
            <ul>
                <li>falhas, atrasos ou problemas ocorridos durante a realização dos Eventos;</li>
                <li>acidentes, lesões, perdas ou danos ocorridos com Atletas;</li>
                <li>informações incorretas fornecidas por Organizadores;</li>
                <li>indisponibilidade temporária da plataforma por motivos técnicos ou de força maior.</li>
            </ul>

            <h3>7. Conteúdos e Propriedade Intelectual</h3>
            <p>
                Todos os elementos da plataforma — textos, marcas, logotipos, layout, funcionalidades e tecnologia — são propriedade do SymplePass ou licenciados.
                É proibido copiar, modificar, distribuir ou reproduzir qualquer conteúdo sem autorização.
            </p>

            <h3>8. Conduta do Usuário</h3>
            <p>O Usuário compromete-se a não:</p>
            <ul>
                <li>usar a plataforma para fins ilegais;</li>
                <li>enviar informações falsas;</li>
                <li>tentar acessar áreas restritas ou violar sistemas de segurança;</li>
                <li>prejudicar outros Usuários ou o funcionamento da plataforma.</li>
            </ul>

            <h3>9. Privacidade e Proteção de Dados</h3>
            <p>
                O tratamento de informações pessoais é regido pela nossa Política de Privacidade, alinhada às exigências da LGPD.
                Ao usar o SymplePass, o Usuário concorda com o uso de seus dados conforme essa política.
            </p>

            <h3>10. Alterações dos Termos</h3>
            <p>
                O SymplePass pode atualizar estes Termos a qualquer momento.
                As alterações entram em vigor na data de publicação, e o uso contínuo da plataforma implica aceitação das novas condições.
            </p>

            <h3>11. Encerramento da Conta</h3>
            <p>
                O Usuário pode solicitar o encerramento da conta a qualquer momento.
                Dados relacionados a transações e obrigações legais podem ser mantidos conforme legislação aplicável.
            </p>

            <h3>12. Lei Aplicável e Foro</h3>
            <p>
                Estes Termos são regidos pelas leis brasileiras.
                Em caso de conflitos, fica eleito o foro da cidade de Santos/SP, exceto quando a lei prever diferente.
            </p>

            <h3>13. Contato</h3>
            <p>Em caso de dúvidas sobre estes Termos, o Usuário pode entrar em contato:</p>
            <p><strong>E-mail:</strong> contato@symplepass.com.br</p>
        </LegalLayout>
    )
}
