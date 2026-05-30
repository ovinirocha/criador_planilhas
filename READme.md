# ⊞ GridForge — Gerador de Planilhas Premium

O **GridForge** é um editor e gerador de planilhas moderno, rápido e responsivo, construído totalmente com **JavaScript Puro (Vanilla JS)**, HTML5 e CSS3. 

Esqueça as interfaces pesadas e os layouts sem graça dos anos 2000. O GridForge traz uma estética **Pro Dark Theme** (inspirada em ferramentas voltadas para desenvolvedores) combinada com recursos avançados de usabilidade que transformam a experiência de gerenciar dados no navegador.

---

## ⚡ Funcionalidades Principais

* **🔄 Fórmulas em Tempo Real:** Digite `=` seguido de uma expressão matemática simples (ex: `=50*2/4`) e a célula calculará o resultado automaticamente assim que você sair dela.
* **⌨️ Navegação Estilo Excel:** Use as setas do teclado (`Seta para Cima` e `Seta para Baixo`) para navegar rapidamente entre as linhas da planilha sem precisar tocar no mouse. O texto é selecionado automaticamente para edição instantânea.
* **📊 Linha de Totais Inteligente:** Uma linha de somatório automática no final da tabela para colunas numéricas, percentuais e de moeda. Ela atualiza instantaneamente ao digitar e **soma apenas as linhas que estão visíveis**, respeitando os filtros de busca.
* **📁 Sistema Multi-aba:** Crie quantas abas precisar. Dê um duplo clique para renomear e gerencie projetos complexos divididos em abas.
* **🛠️ Colunas Inteligentes:** Suporte a múltiplos tipos de dados com máscaras nativas: Texto, Número, Moeda (R$), Data, Percentual, E-mail, Checkbox e Telefone (com formatação automática).
* **💾 Histórico Blindado (Undo/Redo) & LocalStorage:** Suporte a até 80 níveis de desfazer/refazer (`Ctrl+Z` e `Ctrl+Y`). Além disso, seus dados são salvos automaticamente no navegador para você nunca perder o progresso.
* **📥 Importação e Exportação Avançada:**
  * **Importar:** Arraste ou clique para carregar arquivos `.csv`, `.xlsx` ou `.xls`. O app cria a estrutura de colunas e abas na hora.
  * **Excel (.xlsx):** Exporta todas as abas juntas, gerando um arquivo binário estilizado com cabeçalho amarelo e linhas alternadas (*zebra*).
  * **PDF Selecionável:** Um modal exclusivo que deixa você escolher quais abas quer imprimir, gerando um relatório em PDF limpo, profissional e com quebras de página automáticas.

---

## 🎨 Design & UI/UX

* **Paleta Zinc & Neon Cyan/Yellow:** Tons pretos e grafites profundos para mitigar a fadiga visual, com contrastes elegantes e modernos.
* **Efeito Glassmorphic:** Modais e notificações (Toasts) elegantes com desfoque de fundo real (`backdrop-filter`).
* **Micro-interações:** Animações fluidas ao adicionar linhas, hovers táteis que facilitam a leitura visual de dados e scrollbars minimalistas.

---

## 🚀 Como Executar o Projeto

Como o projeto utiliza apenas tecnologias nativas do navegador, você não precisa instalar nada:

1. Clone ou baixe este repositório.
2. Certifique-se de que todos os arquivos (`index.html`, `style.css`, `script.js`) estão na mesma pasta.
3. Abra o arquivo `index.html` em qualquer navegador moderno.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 & CSS3 Avançado** (Flexbox, CSS Grid, Variáveis CSS)
* **JavaScript Puro / Vanilla (ES6+)** (Manipulação de DOM de alta performance)
* **XLSX-js-Style** (Para geração e estilização de arquivos binários do Excel)