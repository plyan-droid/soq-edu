import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route=createFileRoute("/join-us")({beforeLoad:()=>{throw redirect({to:"/careers"})}});