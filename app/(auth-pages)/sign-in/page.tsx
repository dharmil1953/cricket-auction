"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../../utils/auth-helpers/actions";
import Link from "next/link";

import * as Yup from "yup";
import { useFormik } from "formik";

interface signIn {
  email: string;
  password: string;
}

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .test(
        "no-html-tags",
        "HTML tags or scripts are not allowed",
        (value) => !/<\/?[a-z][\s\S]*>/i.test(value as string)
      )
      .required("Email is required"),
    password: Yup.string()
      .test(
        "no-html-tags",
        "HTML tags or scripts are not allowed",
        (value) => !/<\/?[a-z][\s\S]*>/i.test(value as string)
      )
      .required("Password is required"),
  });

  const handleSignIn = async (values: signIn) => {
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("email", values.email);
    form.append("password", values.password);

    try {
      const result: any = await login(form);

      if (result.status === "error") {
        setError(result.message);
      } else if (result.status === "success") {
        const { redirectUrl } = result;
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { handleSubmit, values, handleChange, errors, touched, handleBlur } =
    useFormik({
      initialValues: { email: "", password: "" },
      onSubmit: (values) => {
        handleSignIn(values);
      },
      validationSchema,
    });

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-5 py-8 sm:py-0 bg-gray-100">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full mx-auto sm:w-full max-w-[480px]">
        <h2 className="text-2xl text-center text-black font-semibold mb-6">
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-black text-lg mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={handleChange}
              value={values.email}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
            {touched.email && errors.email && (
              <div className="text-red-500 text-sm">{errors.email}</div>
            )}
          </div>
          <div className="mb-6">
            <label className="block text-black text-lg mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
              value={values.password}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
            {touched.password && errors.password && (
              <div className="text-red-500 text-sm">{errors.password}</div>
            )}
          </div>
          <button
            type="submit"
            className="w-full text-white py-[12px] sm:py-[14px] text-base sm:text-lg rounded bg-black hover:bg-transparent border-[1px] border-black hover:text-black"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </form>
        <p className="mt-6 text-lg text-center text-black">
          Need to create an account?{" "}
          <Link
            href="/sign-up"
            className="text-black hover:opacity-60 inline-block"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
