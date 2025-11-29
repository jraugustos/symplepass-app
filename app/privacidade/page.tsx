import { LegalLayout } from '@/components/layout/legal-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Privacidade | SymplePass',
    description: 'Política de Privacidade da SymplePass. Saiba como coletamos, usamos e protegemos seus dados.',
}

export default function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidade" lastUpdated="28/6/2025">
            <p>
                A SymplePass valoriza sua privacidade e se compromete a proteger os dados pessoais de todos os Usuários — organizadores de eventos e atletas — que utilizam nossa plataforma. Esta Política de Privacidade explica como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações.
            </p>
            <p>
                Ao acessar ou utilizar o SymplePass, você declara estar ciente e de acordo com as práticas descritas nesta Política.
            </p>

            <h3>1. Dados que Coletamos</h3>

            <h4>1.1. Dados fornecidos diretamente pelo Usuário</h4>
            <ul>
                <li>Nome completo</li>
                <li>Documento de identificação (quando necessário para eventos específicos)</li>
                <li>Data de nascimento</li>
                <li>Endereço de e-mail</li>
                <li>Telefone</li>
                <li>Informações de pagamento (processadas por intermediadores)</li>
                <li>Dados necessários para inscrições em eventos (categorias, tamanhos de camiseta, equipes, entre outros)</li>
            </ul>

            <h4>1.2. Dados coletados automaticamente</h4>
            <ul>
                <li>Endereço IP</li>
                <li>Dados de acesso (data/hora, páginas visitadas, preferências)</li>
                <li>Informações sobre dispositivo e navegador</li>
                <li>Cookies e tecnologias semelhantes</li>
            </ul>

            <h4>1.3. Dados fornecidos por Organizadores</h4>
            <ul>
                <li>Informações sobre eventos</li>
                <li>Regras, requisitos e categorias</li>
                <li>Solicitações adicionais de dados sobre atletas, quando necessárias para a participação no evento</li>
            </ul>

            <h3>2. Finalidades do Uso dos Dados</h3>
            <p>Utilizamos as informações coletadas para:</p>
            <ul>
                <li>Criar e gerenciar a conta do Usuário</li>
                <li>Efetuar inscrições em eventos esportivos</li>
                <li>Processar pagamentos e emitir comprovantes</li>
                <li>Facilitar a comunicação entre Atletas e Organizadores</li>
                <li>Enviar notificações, atualizações e suporte</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Melhorar a experiência do Usuário e funcionalidades da plataforma</li>
                <li>Garantir segurança, prevenção de fraudes e uso indevido</li>
            </ul>

            <h3>3. Compartilhamento de Dados</h3>
            <p>O SymplePass não comercializa dados pessoais. Podemos compartilhar informações apenas:</p>

            <h4>3.1. Com Organizadores de Eventos</h4>
            <p>Apenas os dados necessários para a realização e gestão do evento.</p>

            <h4>3.2. Com fornecedores e parceiros operacionais</h4>
            <p>Tais como:</p>
            <ul>
                <li>Gateways de pagamento</li>
                <li>Serviços de hospedagem de dados</li>
                <li>Ferramentas de envio de e-mails</li>
                <li>Suporte técnico</li>
            </ul>
            <p>Esses parceiros atuam em conformidade com a LGPD e apenas para fins contratados.</p>

            <h4>3.3. Quando exigido por lei</h4>
            <p>Em cumprimento a obrigações legais, decisões judiciais ou solicitações de autoridades competentes.</p>

            <h3>4. Armazenamento e Segurança</h3>
            <p>Adotamos medidas técnicas e administrativas para proteger os dados contra:</p>
            <ul>
                <li>Acessos não autorizados</li>
                <li>Perdas</li>
                <li>Alterações</li>
                <li>Divulgações indevidas</li>
            </ul>
            <p>Armazenamos informações apenas pelo tempo necessário para cumprir as finalidades previstas nesta Política ou obrigações legais.</p>

            <h3>5. Direitos do Titular de Dados (LGPD)</h3>
            <p>Nos termos da LGPD, você pode solicitar:</p>
            <ul>
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos seus dados</li>
                <li>Correção de dados incorretos ou incompletos</li>
                <li>Exclusão ou anonimização de dados, quando aplicável</li>
                <li>Portabilidade</li>
                <li>Revogação de consentimento</li>
                <li>Informações sobre compartilhamentos</li>
                <li>Oposição ao tratamento, quando cabível</li>
            </ul>
            <p>Solicitações podem ser enviadas pelo canal oficial de suporte (ver item 9).</p>

            <h3>6. Cookies e Tecnologias de Rastreamento</h3>
            <p>Usamos cookies para:</p>
            <ul>
                <li>Lembrar preferências do Usuário</li>
                <li>Melhorar navegação</li>
                <li>Analisar tráfego</li>
                <li>Personalizar conteúdo</li>
            </ul>
            <p>O Usuário pode gerenciar cookies diretamente no navegador, porém algumas funcionalidades podem ser afetadas.</p>

            <h3>7. Menores de Idade</h3>
            <p>A plataforma pode ser utilizada por menores apenas com autorização dos responsáveis, especialmente quando exigido em eventos específicos.</p>
            <p>Podemos solicitar comprovação de consentimento, quando necessário.</p>

            <h3>8. Retenção e Exclusão de Dados</h3>
            <p>Os dados serão mantidos:</p>
            <ul>
                <li>Pelo período necessário para prestação dos serviços</li>
                <li>Enquanto houver obrigação legal ou regulatória</li>
                <li>Enquanto for necessário para defesa em processos judiciais ou administrativos</li>
            </ul>
            <p>Após esses prazos, os dados serão excluídos ou anonimizados.</p>

            <h3>9. Canal de Contato (DPO)</h3>
            <p>Para exercer seus direitos ou tirar dúvidas sobre esta Política:</p>
            <p><strong>E-mail:</strong> contato@symplepass.com.br</p>

            <h3>10. Alterações desta Política</h3>
            <p>O SymplePass pode atualizar esta Política de Privacidade a qualquer momento, mediante publicação da nova versão.</p>
            <p>A continuidade do uso da plataforma implica aceitação das alterações.</p>

            <h3>11. Disposições Finais</h3>
            <p>Esta Política é regida pelas leis brasileiras, em especial a Lei Geral de Proteção de Dados (LGPD).</p>
            <p>Ao utilizar o SymplePass, o Usuário confirma ter lido e compreendido esta Política de Privacidade.</p>
        </LegalLayout>
    )
}
