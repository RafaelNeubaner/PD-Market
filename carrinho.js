const cartBadge = document.querySelector('.cart-badge');
const carrinho = document.getElementById('carrinho');
const cartApi = window.PDMarketCart;
let quantidadeCarrinho = 0;

function getProdutoDados(produto) {
    const nome = produto.querySelector('h3, h4')?.textContent?.trim() || 'Produto';
    const id = cartApi?.parseProduto ? cartApi.parseProduto(nome) : nome.toLowerCase().replace(/\s+/g, '-');
    const precoTexto = produto.querySelector('.preco .span2, .preço .span2')?.textContent || 'R$ 0,00';
    const preco = cartApi?.parseValor ? cartApi.parseValor(precoTexto) : 0;
    const img = produto.querySelector('img')?.getAttribute('src') || '';
    const qtd = parseInt(produto.querySelector('.quantidade .span1')?.textContent || '0', 10) || 0;

    return { id, nome, preco, img, qtd };
}

function sincronizarQuantidadeCarrinho() {
    if (cartApi) {
        quantidadeCarrinho = cartApi.getTotalItens();
        return;
    }
    quantidadeCarrinho = 0;
    document.querySelectorAll('.produto-carrinho').forEach((produto) => {
        const qtd = parseInt(produto.querySelector('.quantidade .span1')?.textContent || '0', 10) || 0;
        quantidadeCarrinho += qtd;
    });
}

function sincronizarStorageComPagina() {
    if (!cartApi) return;

    const totais = new Map();
    document.querySelectorAll('.produto-carrinho').forEach((produto) => {
        const item = getProdutoDados(produto);
        if (!item.id) return;

        const existente = totais.get(item.id);
        if (existente) {
            existente.qtd += item.qtd;
        } else {
            totais.set(item.id, {
                id: item.id,
                nome: item.nome,
                preco: item.preco,
                qtd: item.qtd,
                img: item.img
            });
        }
    });

    cartApi.saveCart(Array.from(totais.values()).filter((item) => item.qtd > 0));
}


addEventListener('DOMContentLoaded', () => {
    if (cartApi && cartApi.getCart().length === 0) {
        sincronizarStorageComPagina();
    }

    sincronizarQuantidadeCarrinho();

    const contentWrap = document.querySelector('.content-wrap');
    if (contentWrap) {
        contentWrap.addEventListener('click', (event) => {
            const botaoAdicionar = event.target.closest('.adicionar');
            if (botaoAdicionar) {
                somarItem({ currentTarget: botaoAdicionar });
                return;
            }

            const botaoSubtrair = event.target.closest('.subtrair');
            if (botaoSubtrair) {
                subtrairItem({ currentTarget: botaoSubtrair });
                return;
            }

            const botaoRemover = event.target.closest('.remover');
            if (botaoRemover) {
                removerItem({ currentTarget: botaoRemover });
            }
        });

        const observer = new MutationObserver(() => {
            sincronizarQuantidadeCarrinho();
            atualizarBadge();
            atualizarSubtotal();
        });

        observer.observe(contentWrap, { childList: true });

        const resumo = document.querySelector('.resumo');
        if (cartApi.getCart().length === 0 && resumo) {
            resumo.style.display = 'none';
        }
    }

    carregarCarrinho();
    atualizarBadge();
    atualizarSubtotal();
});



function somarItem(event) {
    const produto = event.currentTarget.closest('.produto-carrinho');
    if (!produto) return;

    const precoSpan = produto.querySelector('.preco .span2, .preço .span2');
    const quantidadeSpan = produto.querySelector('.quantidade .span1');
    const totalSpan = produto.querySelector('.total .span2');

    if (!precoSpan || !quantidadeSpan || !totalSpan) return;

    const precoProduto = parseFloat(precoSpan.textContent.replace('R$', '').replace(',', '.'));
    let qtd = parseInt(quantidadeSpan.textContent, 10) || 0;
    qtd++;
    quantidadeSpan.textContent = String(qtd);

    const subtotalProduto = precoProduto * qtd;
    totalSpan.textContent = `R$ ${subtotalProduto.toFixed(2).replace('.', ',')}`;

    const item = getProdutoDados(produto);
    if (cartApi) {
        cartApi.addToCart({ id: item.id, nome: item.nome, preco: item.preco, img: item.img }, 1);
    }

    atualizarSubtotal();
    atualizarBadge();
}

function subtrairItem(event) {
    const produto = event.currentTarget.closest('.produto-carrinho');
    if (!produto) return;

    const precoSpan = produto.querySelector('.preco .span2, .preço .span2');
    const quantidadeSpan = produto.querySelector('.quantidade .span1');
    const totalSpan = produto.querySelector('.total .span2');

    if (!precoSpan || !quantidadeSpan || !totalSpan) return;

    const precoProduto = parseFloat(precoSpan.textContent.replace('R$', '').replace(',', '.'));
    let qtd = parseInt(quantidadeSpan.textContent, 10) || 0;

    if (qtd > 0) {
        qtd--;
        quantidadeSpan.textContent = String(qtd);

        const subtotalProduto = precoProduto * qtd;
        totalSpan.textContent = `R$ ${subtotalProduto.toFixed(2).replace('.', ',')}`;

        const item = getProdutoDados(produto);
        if (cartApi) {
            cartApi.removeFromCart(item.id, 1);
        }

        atualizarBadge();
        atualizarSubtotal();
    }
    if (qtd === 0) {
        produto.remove();
        if (cartApi) {
            sincronizarStorageComPagina();
        }
        atualizarBadge();
        atualizarSubtotal();
    }
}

function atualizarBadge() {
    sincronizarQuantidadeCarrinho();
    if (cartBadge) {
        cartBadge.textContent = String(quantidadeCarrinho);
    }
    if (cartApi) {
        cartApi.atualizarBadgeGlobal();
    }
    if (!carrinho) return;

    const textoVazio = carrinho.querySelector('.carrinho-vazio');
    const resumo = carrinho.querySelector('.resumo');

    if (quantidadeCarrinho === 0) {
        if (!textoVazio) {
            const texto = document.createElement('p');
            texto.className = 'carrinho-vazio';
            texto.textContent = 'Seu carrinho está vazio';
            carrinho.appendChild(texto);
            resumo.style.display = 'none';
        }
    } else {
        if (textoVazio) {
            textoVazio.remove();
            resumo.style.display = 'flex';
        }
    }
}

function atualizarSubtotal() {
    let subtotal = 0;
    document.querySelectorAll('.produto-carrinho').forEach(produto => {
        let subtotalProduto = parseFloat(produto.querySelector('.total .span2').textContent.replace('R$', '').replace(',', '.'));
            subtotal += subtotalProduto;
    });
    let subtotalElement = document.querySelector('.resumo .span2');
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

document.querySelectorAll('.finalizar').forEach(button => {
    button.addEventListener('click', () => {
        alert('Compra finalizada com sucesso!');
        if (cartApi) {
            cartApi.clearCart();
        }
        document.querySelectorAll('.produto-carrinho').forEach((produto) => produto.remove());
        quantidadeCarrinho = 0;
        atualizarBadge();
        atualizarSubtotal();
    });
});

function removerItem(event) {
    let produto = event.currentTarget.closest('.produto-carrinho');
    if (!produto) return;

    const item = getProdutoDados(produto);

    produto.remove();
    if (cartApi) {
        cartApi.removeFromCart(item.id, item.qtd);
        sincronizarStorageComPagina();
    }
    atualizarBadge();
    atualizarSubtotal();
}

function carregarCarrinho() {
    if (!cartApi) return;

    const conteiner = document.querySelector('.content-wrap');
    const itens = cartApi.getCart();
    if (!itens || itens.length === 0) return;

    itens.forEach(item => {
        const produtoHTML = `
            <div class="produto-carrinho">
                <img src="${item.img}" alt="${item.nome}">
                <div class="info">
                    <h4>${item.nome}</h4>
                    <p class="preco">Preço: <span class="span2">R$ ${item.preco.toFixed(2).replace('.', ',')}</span></p>
                    <div class="quantidade">
                        <button class="subtrair">-</button>
                        <span class="span1">${item.qtd}</span>
                        <button class="adicionar">+</button>
                    </div>
                    <p class="total">Total: <span class="span2">R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span></p>
                    <button class="remover">Remover</button>
                </div>
            </div>
        `;
        conteiner.insertAdjacentHTML('beforeend', produtoHTML);
    });

    atualizarBadge();
    atualizarSubtotal();
}