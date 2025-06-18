import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  backButton?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children, backButton }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div className="flex items-center">
        {backButton && <div className="mr-3">{backButton}</div>}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-slate-500">{description}</p>}
        </div>
      </div>
      {children && <div className="flex">{children}</div>}
    </div>
  );
};

export default PageHeader;
