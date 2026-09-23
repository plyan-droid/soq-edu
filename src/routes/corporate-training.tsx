import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route=createFileRoute("/corporate-training")({beforeLoad:()=>{throw redirect({to:"/businesses"})}});
