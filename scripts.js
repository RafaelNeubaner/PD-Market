const CART_STORAGE_KEY = "pdmarket_cart";

function parseProduto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function parseValor(valorTexto) {
    const limpo = String(valorTexto || "")
        .replace(/\s/g, "")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".");
    const valor = Number.parseFloat(limpo);
    return Number.isFinite(valor) ? valor : 0;
}

function getCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getTotalItens(cart = getCart()) {
    return cart.reduce((acc, item) => acc + (Number(item.qtd) || 0), 0);
}

function atualizarBadgeGlobal() {
    const total = getTotalItens();
    document.querySelectorAll(".cart-badge, .badge").forEach((badge) => {
        badge.textContent = String(total);
    });
}

function addToCart(item, quantidade = 1) {

    const cart = getCart();
    const index = cart.findIndex((produto) => produto.id === item.id);

    if (index >= 0) {
        cart[index].qtd += quantidade;
    } else {
        cart.push({
            id: item.id,
            nome: item.nome,
            preco: item.preco,
            qtd: quantidade,
            img: item.img || ""
        });
    }

    saveCart(cart);
    atualizarBadgeGlobal();
}

function removeFromCart(itemId, quantidade = 1) {

    const cart = getCart();
    const index = cart.findIndex((produto) => produto.id === itemId);
    if (index < 0) return;

    cart[index].qtd -= quantidade;
    if (cart[index].qtd <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    atualizarBadgeGlobal();
}

function clearCart() {
    saveCart([]);
    atualizarBadgeGlobal();
}

window.PDMarketCart = {
    getCart,
    saveCart,
    getTotalItens,
    atualizarBadgeGlobal,
    addToCart,
    removeFromCart,
    clearCart,
    parseProduto,
    parseValor
};

document.addEventListener("DOMContentLoaded", () => {
    atualizarBadgeGlobal();

    const infoModais = Array.from(document.querySelectorAll("#informações-produtos .card-informação"));
    const gatilhosInfo = Array.from(document.querySelectorAll("[data-modal-target]"));
    const botoesFecharInfo = Array.from(document.querySelectorAll("[data-modal-close]"));
    let modalInfoAberto = null;

    const fecharModalInfo = () => {
        if (!modalInfoAberto) return;
        modalInfoAberto.classList.remove("is-open");
        modalInfoAberto.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        modalInfoAberto = null;
    };

    const abrirModalInfo = (idModal) => {
        const modal = document.getElementById(idModal);
        if (!modal || !modal.classList.contains("card-informação")) return;
        if (modalInfoAberto && modalInfoAberto !== modal) {
            fecharModalInfo();
        }

        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        modalInfoAberto = modal;
    };

    infoModais.forEach((modal) => {
        modal.setAttribute("aria-hidden", "true");
    });

    gatilhosInfo.forEach((gatilho) => {
        gatilho.addEventListener("click", (event) => {
            event.preventDefault();
            const idModal = event.currentTarget.getAttribute("data-modal-target");
            if (!idModal) return;
            abrirModalInfo(idModal);
        });
    });

    botoesFecharInfo.forEach((botao) => {
        botao.addEventListener("click", fecharModalInfo);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            fecharModalInfo();
        }
    });

    document.querySelectorAll(".addcarrinho").forEach((botao) => {
        botao.addEventListener("click", (event) => {
            const card = event.currentTarget.closest(".card-produtos");
            if (!card) return;

            const nome = card.querySelector("h3")?.textContent?.trim() || "Produto";
            const id = parseProduto(nome);
            const precoTexto = card.querySelector(".product-info .preço, .product-info .preco")?.textContent || "R$ 0,00";
            const preco = parseValor(precoTexto);
            const img = card.querySelector("img")?.getAttribute("src") || "";

            addToCart({ id, nome, preco, img }, 1);
            modalToggle();
        });
    });

    const filtroForm = document.querySelector("#filtro form");
    const precoMinInput = document.getElementById("preco-minimo");
    const precoMaxInput = document.getElementById("preco-maximo");
    const precoMinOutput = document.getElementById("out");
    const precoMaxOutput = document.getElementById("valor-maximo");
    const categoriaSelect = document.getElementById("categoria");
    const marcaInput = document.getElementById("input-marca");
    const buscaInput = document.querySelector(".search-input");
    const produtoCards = Array.from(document.querySelectorAll("#produtos .card-produtos"));
    const categorias = Array.from(document.querySelectorAll("#produtos .categoria-produtos"));

    if (!filtroForm || !precoMinInput || !precoMaxInput || !precoMinOutput || !precoMaxOutput) {
        return;
    }

    const semResultado = document.createElement("p");
    semResultado.id = "sem-resultado";
    semResultado.textContent = "Nenhum produto encontrado com os filtros aplicados.";
    semResultado.style.display = "none";
    semResultado.style.margin = "1rem 0";
    semResultado.style.fontWeight = "bold";
    document.getElementById("produtos")?.prepend(semResultado);

    const normalizarTexto = (texto) => {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    };

    const parsePreco = (textoPreco) => {
        const limpo = (textoPreco || "")
            .replace(/[^\d,.-]/g, "")
            .replace(/\./g, "")
            .replace(/,/g, ".");

        const valor = Number.parseFloat(limpo);
        return Number.isFinite(valor) ? valor : 0;
    };

    const formatarPreco = (valor) => {
        return `R$${Number(valor).toFixed(2)}`;
    };

    const obterPrecoCard = (card) => {
        const precos = card.querySelectorAll(".product-info p[class*='pre']");
        if (!precos.length) {
            return 0;
        }

        const precoAtual = precos[precos.length - 1].textContent;
        return parsePreco(precoAtual);
    };

    const atualizarValoresPreco = () => {
        let minimo = Number.parseFloat(precoMinInput.value) || 0;
        let maximo = Number.parseFloat(precoMaxInput.value) || 0;

        if (minimo > maximo) {
            if (document.activeElement === precoMinInput) {
                maximo = minimo;
                precoMaxInput.value = String(maximo);
            } else {
                minimo = maximo;
                precoMinInput.value = String(minimo);
            }
        }

        precoMinOutput.textContent = formatarPreco(minimo);
        precoMaxOutput.textContent = formatarPreco(maximo);
    };

    const aplicarFiltros = () => {
        const precoMinimo = Number.parseFloat(precoMinInput.value) || 0;
        const precoMaximo = Number.parseFloat(precoMaxInput.value) || 0;
        const categoriaSelecionada = normalizarTexto(categoriaSelect?.value || "");
        const marcaSelecionada = normalizarTexto(marcaInput?.value || "");
        const buscaTexto = normalizarTexto(buscaInput?.value || "");

        let cardsVisiveis = 0;

        produtoCards.forEach((card) => {
            const secaoCategoria = card.closest(".categoria-produtos");
            const idCategoria = normalizarTexto(secaoCategoria?.id || "");
            const nomeProduto = normalizarTexto(card.querySelector("h3")?.textContent || "");
            const descricaoProduto = normalizarTexto(card.querySelector("figcaption")?.textContent || "");
            const textoCompleto = `${nomeProduto} ${descricaoProduto}`.trim();
            const preco = obterPrecoCard(card);

            const atendePreco = preco >= precoMinimo && preco <= precoMaximo;
            const atendeCategoria = !categoriaSelecionada || idCategoria === categoriaSelecionada;
            const atendeMarca = !marcaSelecionada || textoCompleto.includes(marcaSelecionada);
            const atendeBusca = !buscaTexto || textoCompleto.includes(buscaTexto);

            const visivel = atendePreco && atendeCategoria && atendeMarca && atendeBusca;
            card.style.display = visivel ? "" : "none";

            if (visivel) {
                cardsVisiveis += 1;
            }
        });

        categorias.forEach((secao) => {
            const possuiCardVisivel = Array.from(secao.querySelectorAll(".card-produtos")).some(
                (card) => card.style.display !== "none"
            );
            secao.style.display = possuiCardVisivel ? "" : "none";
        });

        semResultado.style.display = cardsVisiveis > 0 ? "none" : "block";
    };

    filtroForm.addEventListener("submit", (event) => {
        event.preventDefault();
        atualizarValoresPreco();
        aplicarFiltros();
    });

    [precoMinInput, precoMaxInput].forEach((slider) => {
        slider.addEventListener("input", () => {
            atualizarValoresPreco();
            aplicarFiltros();
        });
    });

    categoriaSelect?.addEventListener("change", aplicarFiltros);
    marcaInput?.addEventListener("input", aplicarFiltros);
    buscaInput?.addEventListener("input", aplicarFiltros);

    atualizarValoresPreco();
    aplicarFiltros();
});


function modalToggle() {
    const modal = document.querySelector('.cart-modal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    }
}