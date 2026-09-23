import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route=createFileRoute("/job-matching-program")({beforeLoad:()=>{throw redirect({to:"/job-matching"})}});
