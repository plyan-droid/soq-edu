import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route=createFileRoute("/trainer/list")({beforeLoad:()=>{throw redirect({to:"/trainers"})}});