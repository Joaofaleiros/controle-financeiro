const formulario = document.getElementById("form-lancamento");
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoTipo = document.getElementById("tipo");
const campoCategoria = document.getElementById("categoria");

const saldoElemento = document.getElementById("saldo");
const receitasElemento = document.getElementById("receitas");
const despesasElemento = document.getElementById("despesas");
const listaLancamentos = document.getElementById("lista-lancamentos");
const filtroTipo = document.getElementById("filtro-tipo");
const campoData = document.getElementById("data");
const campoDataInicial = document.getElementById("data-inicial");
const campoDataFinal = document.getElementById("data-final");

// Recupera os lançamentos salvos no navegador
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

// Formata os valores como moeda brasileira
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Salva os lançamentos no navegador
function salvarLancamentos() {
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}
// Controla o gráfico financeiro
let graficoFinanceiro;

// Cria e atualiza o gráfico de receitas e despesas
function atualizarGrafico(receitas, despesas) {
  const contexto = document.getElementById("grafico-financeiro");

  if (!contexto || typeof Chart === "undefined") {
    return;
  }

  if (!graficoFinanceiro) {
    graficoFinanceiro = new Chart(contexto, {
      type: "bar",
      data: {
        labels: ["Receitas", "Despesas"],
        datasets: [
          {
            label: "Valor (R$)",
            data: [receitas, despesas],
            backgroundColor: ["#16a34a", "#dc2626"],
            hoverBackgroundColor: ["#15803d", "#b91c1c"],
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 90,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (contexto) =>
                " " + contexto.label + ": " + formatarMoeda(contexto.raw),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (valor) => "R$ " + valor.toLocaleString("pt-BR"),
            },
          },
        },
      },
    });
  } else {
    graficoFinanceiro.data.datasets[0].data = [receitas, despesas];
    graficoFinanceiro.update();
  }
}

// Atualiza o resumo financeiro
function atualizarResumo() {
  const receitas = lancamentos
    .filter((item) => item.tipo === "receita")
    .reduce((total, item) => total + item.valor, 0);

  const despesas = lancamentos
    .filter((item) => item.tipo === "despesa")
    .reduce((total, item) => total + item.valor, 0);

  const saldo = receitas - despesas;

  saldoElemento.textContent = formatarMoeda(saldo);
  receitasElemento.textContent = formatarMoeda(receitas);
  despesasElemento.textContent = formatarMoeda(despesas);

  atualizarGrafico(receitas, despesas);
}

// Exibe o histórico de lançamentos
function exibirLancamentos() {
  listaLancamentos.replaceChildren();

  if (lancamentos.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.textContent = "Nenhum lançamento cadastrado.";
    listaLancamentos.appendChild(mensagem);
    return;
  }

  const filtroSelecionado = filtroTipo.value;
  const dataInicial = campoDataInicial.value;
  const dataFinal = campoDataFinal.value;

  const lancamentosFiltrados = lancamentos.filter((item) => {
    const correspondeTipo =
      filtroSelecionado === "todos" || item.tipo === filtroSelecionado;

    // Converte a data brasileira para o formato AAAA-MM-DD
    const partesData = item.data.split("/");
    const dataFormatada = `${partesData[2]}-${partesData[1].padStart(2, "0")}-${partesData[0].padStart(2, "0")}`;

    const correspondeDataInicial = !dataInicial || dataFormatada >= dataInicial;

    const correspondeDataFinal = !dataFinal || dataFormatada <= dataFinal;

    return correspondeTipo && correspondeDataInicial && correspondeDataFinal;
  });

  lancamentosFiltrados.forEach((item) => {
    const lancamento = document.createElement("div");
    lancamento.className = "item-lancamento";

    const descricao = document.createElement("h3");
    descricao.textContent = item.descricao;

    const detalhes = document.createElement("p");
    detalhes.textContent = `${item.categoria} • ${item.data}`;

    const valor = document.createElement("p");
    valor.textContent = `${item.tipo === "receita" ? "+" : "-"} ${formatarMoeda(item.valor)}`;
    valor.style.color = item.tipo === "receita" ? "#087443" : "#C0392B";
    valor.style.fontWeight = "bold";

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", () => {
      excluirLancamento(item.id);
    });

    lancamento.append(descricao, detalhes, valor, botaoExcluir);
    listaLancamentos.appendChild(lancamento);
  });
}

// Adiciona um novo lançamento
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const descricao = campoDescricao.value.trim();
  const valor = Number(campoValor.value.trim().replace(",", "."));
  const tipo = campoTipo.value;
  console.log("Tipo selecionado:", tipo);
  console.log("Lançamentos:", lancamentos);
  const categoria = campoCategoria.value;
  const dataSelecionada = campoData.value;

  if (!descricao || !Number.isFinite(valor) || valor <= 0) {
    alert("Informe uma descrição e um valor maior que zero.");
    return;
  }

  const novoLancamento = {
    id: `${Date.now()}-${Math.random()}`,
    descricao,
    valor,
    tipo,
    categoria,
    data: new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString("pt-BR"),
  };

  lancamentos.unshift(novoLancamento);

  salvarLancamentos();
  atualizarResumo();
  exibirLancamentos();

  formulario.reset();
});

// Exclui um lançamento
function excluirLancamento(id) {
  lancamentos = lancamentos.filter((item) => item.id !== id);

  salvarLancamentos();
  atualizarResumo();
  exibirLancamentos();
}

// Exibe os dados ao abrir a página
atualizarResumo();
exibirLancamentos();

// Atualiza o histórico quando o filtro é alterado
filtroTipo.addEventListener("change", exibirLancamentos);
campoDataInicial.addEventListener("change", exibirLancamentos);
campoDataFinal.addEventListener("change", exibirLancamentos);
