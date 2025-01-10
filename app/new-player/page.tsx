"use client";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileUpload from "@/components/FileUpload";

const PlayerForm = () => {
  const formik = useFormik({
    initialValues: {
      name: "",
      image_url: "",
      base_price: "",
      batting_rating: "",
      bowling_rating: "",
      status: "Batsman",
      sold: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      image_url: Yup.string().required("Image URL is required"),
      base_price: Yup.number()
        .required("Base price is required")
        .min(1000, "Price must be greater than 1000"),
      batting_rating: Yup.number()
        .required("Batting rating is required")
        .min(0, "Invalid rating")
        .max(100, "Invalid rating"),
      bowling_rating: Yup.number()
        .required("Bowling rating is required")
        .min(0, "Invalid rating")
        .max(100, "Invalid rating"),
      status: Yup.string()
        .oneOf(
          ["Batsman", "Bowler", "All-Rounder", "Captain"],
          "Invalid status"
        )
        .required("Status is required"),
    }),
    onSubmit: (values) => {
      const playerData = {
        ...values,
        sold: Boolean(values.sold),
      };
      console.log("Player data submitted: ", playerData);
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Add New Player
      </h1>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="flex flex-col">
          <label
            htmlFor="name"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Player Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.name && formik.errors.name && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.name}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="image_url"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Player Image URL
          </label>
          <FileUpload
            onFileSelect={(url) => {
              formik.setFieldValue("image_url", url);
            }}
            url={formik.values.image_url}
          />
          {formik.touched.image_url && formik.errors.image_url && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.image_url}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="base_price"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Base Price
          </label>
          <input
            id="base_price"
            name="base_price"
            type="number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.base_price}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.base_price && formik.errors.base_price && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.base_price}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="batting_rating"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Batting Rating
          </label>
          <input
            id="batting_rating"
            name="batting_rating"
            type="number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.batting_rating}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.batting_rating && formik.errors.batting_rating && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.batting_rating}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="bowling_rating"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Bowling Rating
          </label>
          <input
            id="bowling_rating"
            name="bowling_rating"
            type="number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.bowling_rating}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.bowling_rating && formik.errors.bowling_rating && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.bowling_rating}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="status"
            className="text-lg font-medium text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.status}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Captain">Captain</option>
          </select>
          {formik.touched.status && formik.errors.status && (
            <div className="text-sm text-red-600 mt-2">
              {formik.errors.status}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-lg font-medium text-gray-700 mb-2">Sold</label>
          <div className="flex items-center space-x-4">
            <label>
              <input
                type="radio"
                name="sold"
                value="true"
                onChange={formik.handleChange}
                checked={formik.values.sold === true}
                className="mr-2"
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="sold"
                value="false"
                onChange={formik.handleChange}
                checked={formik.values.sold === false}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="px-6 py-3 mt-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerForm;
