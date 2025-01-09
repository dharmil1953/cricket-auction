import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import useUser from "@/utils/hooks/useUser";
import useSupabase from "@/utils/hooks/useSupabase";

const BalanceForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();

  const validationSchema = Yup.object({
    fullName: Yup.string().required("Full name is required"),
    amount: Yup.number()
      .positive("Amount must be a positive number")
      .required("Amount for auction deposit is required"),
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      amount: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      if (!user) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from("buyers").upsert([
          {
            name: values?.fullName,
            balance: values?.amount,
            id: user?.id,
          },
        ]);

        if (error) {
          setError(error.message);
        } else {
          alert("Balance Added");
        }
      } catch (err) {
        console.error("Error during form submission:", err);
        setError("An error occurred during submission.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col justify-center items-center px-5 py-28">
      <div className="bg-black bg-opacity-50 p-8 rounded-2xl border border-gray-700 w-full max-w-[480px] backdrop-blur-sm">
        <h2 className="text-3xl text-center font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-8">
          Auction Deposit
        </h2>
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label
              className="block text-yellow-400 text-lg mb-2"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 
                transition-all duration-300"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
            />
            {formik.touched.fullName && formik.errors.fullName && (
              <div className="text-red-400 text-sm mt-1">
                {formik.errors.fullName}
              </div>
            )}
          </div>

          <div>
            <label
              className="block text-yellow-400 text-lg mb-2"
              htmlFor="amount"
            >
              Deposit Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 
                transition-all duration-300"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
            />
            {formik.touched.amount && formik.errors.amount && (
              <div className="text-red-400 text-sm mt-1">
                {formik.errors.amount}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-lg font-bold text-black text-lg
              bg-gradient-to-r from-yellow-500 to-yellow-600 
              hover:from-yellow-600 hover:to-yellow-700
              transform hover:scale-[1.02] transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing
              </span>
            ) : (
              "Add Balance"
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BalanceForm;
