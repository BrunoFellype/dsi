import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function testFirestore() {
    try{
        const docRef = await addDoc(collection(db, "teste"), {
            mensagem: "Olá, Mundo!",
            numero: 123,
            criadoEm: new Date()
        });
        console.log("Documento criado com ID:", docRef.id);
    } catch(error){
        console.error("Erro ao criar documento:", error);
    }

}