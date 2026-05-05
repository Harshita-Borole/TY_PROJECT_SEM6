import { useEffect, useState } from 'react';
import { projectsAPI } from '../utils/api';
import './Portfolio.css'; // we'll create this CSS next

const Portfolio = () => {
  // Initial dummy projects
  const dummyProjects = [
    { id: '1', title: 'Sample Project 1', description: 'This is a sample project description.' },
    { id: '2', title: 'Sample Project 2', description: 'This is a sample project description.' },
    { id: '3', title: 'Sample Project 3', description: 'This is a sample project description.' },
  ];

  const [projects, setProjects] = useState(dummyProjects);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsAPI.getAll()
      .then(data => {
        setProjects(data.length > 0 ? data : dummyProjects);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Showing default projects.');
        setProjects(dummyProjects);
        setLoading(false);
      });
  }, []);

  return (
    <section id="portfolio">
      <h2>My Portfolio</h2>

      {error && <p className="error-message">{error}</p>}

      {loading && <p>Loading projects...</p>}

      <div className="portfolio-grid">
        {projects.map(project => (
          <div key={project.id} className="portfolio-item">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Portfolio;
