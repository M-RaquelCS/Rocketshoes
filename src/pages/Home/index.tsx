import { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}
// a interface 'pegará' as propriedades da interface Product
// e acrescentará a propriedade definida nessa interface

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {

  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    
    const newSumAmount = {...sumAmount}; // imutabilidade

    newSumAmount[product.id] = product.amount; // pegar a quantidade do produto do id especifico e salvar na variável sumAmount

    return newSumAmount;
     
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {
      const response = await api.get<Product[]>('products') // puxar um array de produtos com as propriedades da interface Products

      const data = response.data.map(product => ({
        ...product,
        priceFormatted: formatPrice(product.price)
      }))
      // data será um novo array de produtos com os preços formatados em Real com o formatPrice, importado do arquivo 'util/format.ts'

      setProducts(data);
      // atualizando o array de produtos
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>

      {products.map(product => (
        <li key={product.id}>
          <img src={product.image} alt={product.title}/>
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[product.id] || 0}
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))}

    </ProductList>
  );
};

export default Home;
