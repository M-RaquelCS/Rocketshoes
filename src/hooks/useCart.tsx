import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>; // representa uma ação assíncrona, uma função assíncrona
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart =  localStorage.getItem('@RocketShoes:cart') //Buscar dados do localStorage

    if (storagedCart) {
       return JSON.parse(storagedCart); 
       // receberemos os dados no formato string, então trataremos com JSON.parse 
       // para retornar os dados no formato original, sendo lista, objeto ou etc
    }

    // se não tivermos um storagedCart irá retornar um array, uma lista vazia
    return [];

    // os dados convertidos ou a lista vazia será salva no estado cart
    // no caso iremos retornar os dados no formato de objeto e salvar no cart
    // atendendo as propriedades setada como formato de Product, uma interface definida
    // no arquivo types.ts.
  });

  const addProduct = async (productId: number) => {
    try {

      const updatedCart = [...cart];
      // criação de um novo array, para trabalharmos com a imutabilidade
      // fazemos modificações e atualizações sem modificar os dados em sua raiz,
      // no caso, no estado cart

      const productExists = updatedCart.find(product => product.id === productId)
      // verificamos se o produto existe
      // recebemos um id de um produto como parâmetro
      // pegando o array updateCart, chamamos a função find que irá retornar um product
      // em que ele tem que ter um id exatamente igual ao id recebido como parâmetro

      const stock = await api.get(`/stock/${productId}`);
      // puxamos o stock do produto que recebemos o id como parâmetro da função
      // esperamos a api puxar os dados do fake server

      const stockAmount = stock.data.amount;
      // devolve a quantidade em estoque do produto

      const currentAmount = productExists ? productExists.amount : 0;
      // é quantidade atual do produto, se ele existe no carrinho passamos a quantidade dele
      // se ele não existe passamos a quantidade 0

      const amount = currentAmount + 1 ;
      // ao clicarmos em um produto a quantidade dele será 1 de inicio,
      // clicando novamente somaremos mais um a quantidade

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
        // se a quantidade da cesta ultrapassar a quantidade do stock
        // retornaremos um aviso de erro com o toast
      }

      if(productExists){
        productExists.amount = amount;
        // se o produto já existe na cesta iremos atualizar a quantidade
        // não precisamos atualizar o productExists porque dessa
        // forma já foi atualizado
      }else{
        const product = await api.get(`/products/${productId}`);
        // se o produto não existe chamamos um novo produto

        const newProduct = {
          ...product.data,
          amount: 1
        }
        // pegaremos os dados do novo produto mandamos para a cesta
        // e colocaremos uma quantidade de 1 na cesta

        updatedCart.push(newProduct);// perpetuar os dados

      }

      setCart(updatedCart);
      // mandamos pro carrinho os dados tratados na condição acima
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)) //salvando os dados
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);
      // recebemos um id de um produto como parâmetro
      // pegando o array updateCart, chamamos a função find que irá retornar um index,
      // ou seja, o número da posição do array em que o produto está posicionado, ex: [1]
      // produto esse que tem que ter um id exatamente igual ao id recebido como parâmetro.

      if(productIndex >= 0){ // o findIndex retorna -1 se não achar um valor, por isso essa condição

        updatedCart.splice(productIndex, 1); 
        // splice pode remover elementos de um array recebendo como parâmetros o index onde irá começar a ler para o delete
        // e quantas posições ele deve percorrer para deletar, no nosso caso ele irá começar pelo index do produto e deletará apenas 1
        
        setCart(updatedCart);
        // atualizando o array de produtos sem o produto que selecionamos para remover

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); // salvando os dados

      }else{
        throw Error(); // forçar um erro para ir pro catch
      }

    } catch {

      toast.error('Erro na remoção do produto');

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        return;
      }

      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId)

      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }else{
        throw Error(); // forçar um erro para ir pro catch
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

// useCart um hook desenvolvido para atender toda aplicação, como:
// manipular o localStorage
// exibir toasts
// context CartProvider (adicionar, atualizar e remover produtos)