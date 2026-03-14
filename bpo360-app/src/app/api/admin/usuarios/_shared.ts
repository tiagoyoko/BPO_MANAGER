import { NextResponse } from "next/server";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function validarClienteDoMesmoBpo({
  supabase,
  clienteId,
  bpoId,
}: {
  supabase: SupabaseClient;
  clienteId: string;
  bpoId: string;
}) {
  const { data: cliente, error } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId,
  });

  if (error) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      ),
    };
  }

  if (!cliente) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          data: null,
          error: {
            code: "CLIENTE_INVALIDO",
            message: "clienteId deve pertencer ao mesmo BPO do administrador.",
          },
        },
        { status: 400 }
      ),
    };
  }

  return { ok: true as const };
}
