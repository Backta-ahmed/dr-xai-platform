import React from "react";
import Sidebar from "./Sidebar";

const PageWrapper = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-sand">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          </div>
        )}
        <div className="bg-transparent rounded-xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
