"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setMessage("A nova senha deve possuir pelo menos 8 caracteres.");
    if (password !== confirm) return setMessage("As senhas não coincidem.");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase ainda não está configurado nesta instalação.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMessage("O link pode ter expirado. Solicite uma nova redefinição.");
    await supabase.auth.signOut();
    setMessage("Senha redefinida com sucesso. Volte ao login para entrar novamente.");
  }

  return <main className="authPage"><section className="authCard"><div className="authBrand"><span>B</span><div><strong>Bistore</strong><small>Recuperação de acesso</small></div></div><h1>Nova senha</h1><p>Defina uma nova senha para sua conta. O acesso anterior será encerrado após a alteração.</p>{!isSupabaseConfigured() && <div className="authMessage">Modo local ativo: configure o Supabase para habilitar recuperação de senha em produção.</div>}<form className="formStack" onSubmit={submit}><label className="field"><span>Nova senha</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="field"><span>Confirmar nova senha</span><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>{message && <div className="authMessage">{message}</div>}<button className="primaryButton">Salvar nova senha</button></form><a className="textButton authLink" href="../">Voltar ao login</a></section></main>;
}
