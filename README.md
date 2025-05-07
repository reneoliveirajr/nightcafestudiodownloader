# NightCafe Studio Downloader

NightCafe Studio Downloader é um script JavaScript que permite o download em massa de imagens de uma página do NightCafe Studio. Ele foi criado para facilitar o backup de galerias, baixar artes de outros usuários ou mesmo recuperar artes em situações onde o usuário foi banido pela plataforma.

## ⚡️ Funcionalidades
- Escaneia automaticamente a página atual e identifica todas as imagens relevantes.
- Exclui imagens de assets da interface, como logos, backgrounds e outros elementos desnecessários.
- Oferece uma interface amigável para exportar as URLs das imagens ou baixar todas as imagens em sequência.

## 🚀 Como Usar
1. Acesse a página do NightCafe Studio onde deseja baixar as imagens.
2. Abra o console do navegador (F12 ou Ctrl + Shift + J no Windows e Linux, Option + ⌘ + J no macOS).
3. Cole o código do script disponível [aqui](https://github.com/reneoliveirajr/nightcafestudiodownloader/blob/main/nightcafestudiodownloader.js).
4. Pressione **Enter** para executar o script.

### 📦 Funcionalidades do Painel de Controle
- **Exportar URLs:** Salva um arquivo `nightcafe_urls.txt` contendo todas as URLs encontradas.
- **Baixar Todas:** Baixa todas as imagens encontradas em sequência. 
- **Fechar:** Fecha o painel de controle sem iniciar o download.

## 🔧 Ajustes e Personalizações
- O delay entre os downloads pode ser ajustado alterando o valor da constante `DOWNLOAD_DELAY` no início do script.
- A quantidade máxima de tentativas de scroll é definida em `maxScrollAttempts`.
- O script atualmente ignora imagens com `/assets/` no caminho da URL para evitar o download de logos, backgrounds e outros elementos não essenciais.

## ⚠️ Aviso Legal
Este script foi desenvolvido para facilitar o backup de galerias e a recuperação de imagens pessoais ou públicas. O uso inadequado ou em violação dos termos de uso do NightCafe Studio é de responsabilidade exclusiva do usuário.

---
