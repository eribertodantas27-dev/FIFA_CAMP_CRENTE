# FC Championship 5.0 — Online

Versão com front-end responsivo + Google Apps Script + Google Sheets como banco online.

## O que muda
- Todos os celulares consultam os mesmos dados online.
- Funciona no Google Chrome, Safari, Edge e Firefox.
- Inscrições entram na planilha como pendentes.
- Administrador aprova/recusa jogadores pelo celular.
- Resultados lançados pelo painel ficam disponíveis para todos.
- Classificação é calculada no navegador a partir dos resultados.
- Configuração de nome e fase é salva online.

## Como colocar online (Google)
1. Crie uma planilha nova no Google Sheets.
2. Abra **Extensões → Apps Script**.
3. Apague o código padrão e cole todo o conteúdo de `Code.gs`.
4. Altere `ADMIN_PASSWORD` para uma senha sua.
5. Salve e execute `setup` uma vez. Autorize o projeto.
6. Em **Implantar → Nova implantação → Aplicativo da Web**.
7. Executar como: **você**. Quem tem acesso: **qualquer pessoa**.
8. Copie a URL da implantação.
9. Abra `app.js` e substitua `COLE_AQUI_A_URL_DO_GOOGLE_APPS_SCRIPT` pela URL copiada.
10. Publique a pasta `FC_Championship_5.0` em uma hospedagem HTTPS (GitHub Pages, Netlify ou Vercel).
11. Compartilhe o endereço do site no WhatsApp. Chrome e Safari poderão abrir normalmente.

## Segurança
A senha de administrador é validada no servidor Apps Script, não no HTML. Troque `1234` antes de publicar. Para um projeto maior, recomenda-se autenticação Google/contas e regras de acesso mais avançadas.

## Observação
O Apps Script/Sheets é uma solução simples e barata para um campeonato. Para alto volume, pode-se migrar depois para Firebase/Supabase.
