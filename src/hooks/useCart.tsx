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
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')  // variavel que busca as info do localStorage

    if (storagedCart) {
      return JSON.parse(storagedCart);  // converte aa String em Array
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]                                   // novo array com valores de cart, de forma a manter imutabilidade
      const productExists = updatedCart.find(product => product.id === productId) // veritica se o Array possui o item buscado
    
      const stock = await api.get(`/stock/${productId}`)              // pega o item do Stock pela API
      const stockAmount = stock.data.amount                           // pega a qtd do produto no Stock(Estoque)
      const currentAmount = productExists ? productExists.amount : 0  // pega a qtd do produto no carrinho, e se ele ainda não existir retorna o valor 0
      const amount = currentAmount + 1                                // qtd desejada pelo usuario

      // verifica se a qtd do produto pedida tem no estoque
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      // se o produto de fato existir no carrinho, atualiza a qtd no carrinho
      if(productExists){
        productExists.amount = amount // dessa forma já atualizou o updatedCart
      }else{                          // se ainda não existe no carrinho
        const product = await api.get(`/products/${productId}`)

        // cria um produto com amount seguindo o Type de Product
        const newProduct = {
          ...product.data, 
          amount: 1
        }
        updatedCart.push(newProduct)  // add o produto na variavel de cart
      }

      setCart(updatedCart)  // atualiza o estado/State do carrinho
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))  // transf. Objeto em String

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
