import { Redirect } from 'expo-router';
import { useEffect } from "react";
import { testFirestore } from "../services/testFirestore";

export default function Index() {
  useEffect(() =>{
    testFirestore();
  }, []);
  
  return <Redirect href="/login" />;
}