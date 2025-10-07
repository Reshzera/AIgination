import "dotenv/config";
import GenerateVideoService from "./service/generateVideoService";

const main = async () => {
  await GenerateVideoService.generateVideoFromScript(
    `Crie um vídeo promocional cinematográfico e emocionante para um pet shop chamado Happy Tails Pet Care.
O vídeo deve ter várias cenas que contem uma pequena história mostrando o amor entre os pets e seus donos, destacando os produtos e serviços da loja.
Use iluminação natural suave, animais realistas e transições fluidas.
Adicione uma trilha sonora alegre e envolvente, com piano e violão.
Inclua closes e movimentos de câmera dinâmicos.

Cenas:

Cena 1 – Amor pela Manhã
Um golden retriever acorda o dono lambendo seu rosto.
O dono ri e abraça o cachorro.
A luz do sol entra suavemente pela janela do quarto.
Texto na tela: “Porque todo dia começa com amor.”

Cena 2 – Chegada ao Pet Shop
O dono caminha com o cachorro até o Happy Tails Pet Care.
A câmera percorre prateleiras coloridas cheias de brinquedos, petiscos e produtos de banho.
Funcionários sorriem e cumprimentam o cliente com carinho.

Cena 3 – Hora do Banho
Um tosador simpático dá banho em um poodle branco dentro de uma banheira de aço inox brilhante.
O cachorro se sacode, e a câmera mostra em câmera lenta as gotas d’água voando.
Texto na tela: “Banho e tosa profissional, com carinho.”

Cena 4 – Cantinho dos Gatos
Corte para uma área aconchegante com gatos.
Um gato cinza brinca com uma varinha de penas e depois se deita em uma cama macia.
Um atendente coloca uma coleira nova com delicadeza.

Cena 5 – Clientes Felizes
Montagem de clientes saindo da loja com sacolas, crianças abraçando seus pets, e um papagaio dizendo “Obrigado!” com voz divertida.
Cores vibrantes e atmosfera alegre.

Cena 6 – Caminhada ao Entardecer
O dono e o golden retriever caminham juntos no parque durante o pôr do sol.
Surge o logo e o slogan do Happy Tails Pet Care:
“Pets felizes. Corações felizes.”

Estilo de câmera: cinematográfico, movimentos suaves de dolly, câmera lenta em momentos emocionais, lens flares e profundidade de campo reduzida.
Clima: caloroso, familiar e inspirador.
Proporção: 16:9.
Duração: cerca de 60 segundos.`
  );
};

main();
