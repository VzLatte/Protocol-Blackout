import { Context } from "@colyseus/schema/lib/Schema";
const ctx = new Context();
console.log("Context has '.has' function?", typeof (ctx as any).has === 'function');