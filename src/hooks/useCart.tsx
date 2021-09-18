import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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

  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    prevCartRef.current = cart
  })

  const cartPreviousValue = prevCartRef.current ?? cart

  useEffect(() => {
    if(cartPreviousValue !== cart){
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))  // transf. Objeto em String
    }
  }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]                                   // novo array com valores de cart, de forma a manter imutabilidade
      const productExists = updatedCart.find(product => product.id === productId) // veritica se o Array possui o item buscado

      const stock = await api.get(`/stock/${productId}`)              // pega o item do Stock pela API
      const stockAmount = stock.data.amount                           // pega a qtd do produto no Stock(Estoque)
      const currentAmount = productExists ? productExists.amount : 0  // pega a qtd do produto no carrinho, e se ele ainda não existir retorna o valor 0
      const amount = currentAmount + 1                                // qtd desejada pelo usuario

      // verifica se a qtd do produto pedida tem no estoque
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      // se o produto de fato existir no carrinho, atualiza a qtd no carrinho
      if (productExists) {
        productExists.amount = amount // dessa forma já atualizou o updatedCart
      } else {                          // se ainda não existe no carrinho
        const product = await api.get(`/products/${productId}`)

        // cria um produto com amount seguindo o Type de Product
        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct)  // add o produto na variavel de cart
      }

      setCart(updatedCart)  // atualiza o estado/State do carrinho
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]                 // novo array com valores de cart, de forma a manter imutabilidade
      const productIndex = updatedCart.findIndex(product => product.id === productId)  // usa o findIndex para conseguimos pegar o item e remover do array pelo index

      // o findIndex retorna -1 quando não encontra um item
      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1)         // splice(a partir de qual pos. deve apagar, quantos items)
        setCart(updatedCart)                        // atualiza o estado/State do carrinho

      } else {
        throw Error() // força um erro para cai da condição de Catch
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
      // se a qtd do produto for menor ou igual a 0 sai da função
      if (amount <= 0) return

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount // qtd em estoque

      // se a qtd pedida for maior do que a qtd em estoque
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = [...cart] // novo array com valores de cart, de forma a manter imutabilidade
      const productExists = updatedCart.find(product => product.id === productId)

      // se o produto de fato existir no carrinho, atualiza a qtd no carrinho
      if (productExists) {
        productExists.amount = amount
        setCart(updatedCart)  // atualiza o estado/State do carrinho

      }else{
        throw Error()         // força um erro para cai da condição de Catch
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
