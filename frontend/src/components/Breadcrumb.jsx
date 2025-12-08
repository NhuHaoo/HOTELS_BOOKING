// frontend/src/components/Breadcrumb.jsx
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="py-3 bg-blue-50/50" aria-label="Breadcrumb">
      <div className="container-custom">
        <ol className="flex items-center text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            // Có thể click nếu có path và path không phải null/undefined
            const hasPath = item.path && item.path !== null;
            
            return (
              <li key={index} className="flex items-center">
                {hasPath ? (
                  <>
                    <Link
                      to={item.path}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                    {!isLast && <span className="mx-2 text-gray-400">/</span>}
                  </>
                ) : (
                  <>
                    <span className="text-gray-700 font-medium" aria-current="page">
                      {item.label}
                    </span>
                    {!isLast && <span className="mx-2 text-gray-400">/</span>}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;

