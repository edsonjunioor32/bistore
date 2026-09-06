"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import BistoreWithLabels from "@/components/BistoreWithLabels";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";

export default function AuthGate() {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("E-mail ou senha inválidos.");
  }

  async function sendRecovery(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const base = new URL("./", window.location.href);
    const redirectTo = new URL("redefinir-senha/", base).href;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setMessage(error ? "Não foi possível enviar o link de redefinição." : "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.");
  }

  if (!configured) return <BistoreWithLabels />;
  if (loading) return <main className="appLoading">Validando acesso…</main>;
  if (session) return <BistoreWithLabels />;

  return (
    <main className="authPage">
      <section className="authCard">
        <div className="authBrand"><span aria-label="Logo Bi Store">B</span><div><strong>Bi Store</strong><small>Gestão de estoque e vendas</small></div></div>
        <h1>{recovery ? "Redefinir senha" : "Entrar"}</h1>
        <p>{recovery ? "Informe o e-mail cadastrado para receber o link seguro de redefinição." : "Acesse o sistema com seu e-mail e senha."}</p>
        <form className="formStack" onSubmit={recovery ? sendRecovery : signIn}>
          <label className="field"><span>E-mail</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {!recovery && <label className="field"><span>Senha</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          {message && <div className="authMessage">{message}</div>}
          <button className="primaryButton" type="submit">{recovery ? "Enviar link" : "Entrar"}</button>
        </form>
        <button className="textButton authLink" type="button" onClick={() => { setRecovery((value) => !value); setMessage(""); }}>{recovery ? "Voltar para o login" : "Esqueci minha senha"}</button>
      </section>
    </main>
  );
}
