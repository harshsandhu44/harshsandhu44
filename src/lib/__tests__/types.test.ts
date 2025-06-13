import { describe, it, expect } from 'vitest';
import type { Project } from '../types';

describe('Types', () => {
  describe('Project type', () => {
    it('should accept valid project object', () => {
      const mockProject: Project = {
        label: 'Test Project',
        slug: 'test-project',
        href: '/projects/test-project',
        description: 'A test project description',
        image: '/images/test.png',
        technologies: ['React', 'TypeScript'],
        github: 'https://github.com/test/project',
        live: 'https://test-project.com',
      };

      // Type validation - if this compiles, the type is correct
      expect(mockProject.label).toBe('Test Project');
      expect(mockProject.slug).toBe('test-project');
      expect(mockProject.href).toBe('/projects/test-project');
      expect(mockProject.description).toBe('A test project description');
      expect(mockProject.image).toBe('/images/test.png');
      expect(mockProject.technologies).toEqual(['React', 'TypeScript']);
      expect(mockProject.github).toBe('https://github.com/test/project');
      expect(mockProject.live).toBe('https://test-project.com');
    });

    it('should have all required properties', () => {
      const mockProject: Project = {
        label: 'Another Test',
        slug: 'another-test',
        href: '/projects/another-test',
        description: 'Another description',
        image: '/images/another.png',
        technologies: ['Next.js'],
        github: 'https://github.com/test/another',
        live: 'https://another-test.com',
      };

      // Verify all properties exist
      expect(mockProject).toHaveProperty('label');
      expect(mockProject).toHaveProperty('slug');
      expect(mockProject).toHaveProperty('href');
      expect(mockProject).toHaveProperty('description');
      expect(mockProject).toHaveProperty('image');
      expect(mockProject).toHaveProperty('technologies');
      expect(mockProject).toHaveProperty('github');
      expect(mockProject).toHaveProperty('live');
    });

    it('should support empty technologies array', () => {
      const projectWithNoTech: Project = {
        label: 'Simple Project',
        slug: 'simple',
        href: '/projects/simple',
        description: 'A simple project',
        image: '/images/simple.png',
        technologies: [],
        github: 'https://github.com/test/simple',
        live: 'https://simple.com',
      };

      expect(Array.isArray(projectWithNoTech.technologies)).toBe(true);
      expect(projectWithNoTech.technologies).toHaveLength(0);
    });

    it('should support multiple technologies', () => {
      const projectWithManyTechs: Project = {
        label: 'Complex Project',
        slug: 'complex',
        href: '/projects/complex',
        description: 'A complex project',
        image: '/images/complex.png',
        technologies: [
          'React',
          'Next.js',
          'TypeScript',
          'Tailwind CSS',
          'Node.js',
        ],
        github: 'https://github.com/test/complex',
        live: 'https://complex.com',
      };

      expect(projectWithManyTechs.technologies).toHaveLength(5);
      expect(projectWithManyTechs.technologies).toContain('React');
      expect(projectWithManyTechs.technologies).toContain('TypeScript');
    });
  });
});
