
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage(
        "Registrasi berhasil! Silakan cek email untuk verifikasi akun."
      );
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <Link href="/" className="register-brand">
          MAJDAH<span>.</span>
        </Link>

        <h1>Buat Akun</h1>

        <p className="register-subtitle">
          Mulai kelola portofolio saham Anda bersama MAJDAH.
        </p>

        <form onSubmit={handleRegister}>
          <label>Nama lengkap</label>
          <input
            type="text"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {message && (
            <p className="register-message">{message}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        <p className="register-footer">
          Sudah punya akun? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
