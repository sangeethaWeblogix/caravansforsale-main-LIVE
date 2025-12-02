 import React, { ReactNode } from "react";
   
 import "../components/ListContent/newList.css"
import "./listings.css"

export const revalidate = 60;
  
  export default function Layout({ children }: { children: ReactNode }) {
   return <div>{children}</div>;
 }
 