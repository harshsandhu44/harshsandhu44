import { describe, it, expect } from 'vitest';
import { NAV_LINKS, SOCIAL_LINKS, PROJECTS } from '../constants';
import { GithubIcon, InstagramIcon } from '@/components/icons';

describe('Constants', () => {
  describe('NAV_LINKS', () => {
    it('should be an array with correct structure', () => {
      expect(Array.isArray(NAV_LINKS)).toBe(true);
      expect(NAV_LINKS).toHaveLength(2);
    });

    it('should contain Home link', () => {
      const homeLink = NAV_LINKS.find((link) => link.label === 'Home');
      expect(homeLink).toBeDefined();
      expect(homeLink?.href).toBe('/');
      expect(homeLink?.label).toBe('Home');
    });

    it('should contain Projects link', () => {
      const projectsLink = NAV_LINKS.find((link) => link.label === 'Projects');
      expect(projectsLink).toBeDefined();
      expect(projectsLink?.href).toBe('/projects');
      expect(projectsLink?.label).toBe('Projects');
    });

    it('should have required properties for each link', () => {
      NAV_LINKS.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('href');
        expect(typeof link.label).toBe('string');
        expect(typeof link.href).toBe('string');
        expect(link.href.length).toBeGreaterThan(0);
        expect(link.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SOCIAL_LINKS', () => {
    it('should be an array with correct structure', () => {
      expect(Array.isArray(SOCIAL_LINKS)).toBe(true);
      expect(SOCIAL_LINKS).toHaveLength(2);
    });

    it('should contain GitHub link', () => {
      const githubLink = SOCIAL_LINKS.find((link) => link.label === 'GitHub');
      expect(githubLink).toBeDefined();
      expect(githubLink?.href).toBe('https://github.com/harshsandhu44');
      expect(githubLink?.label).toBe('GitHub');
      expect(githubLink?.icon).toBe(GithubIcon);
    });

    it('should contain Instagram link', () => {
      const instagramLink = SOCIAL_LINKS.find(
        (link) => link.label === 'Instagram'
      );
      expect(instagramLink).toBeDefined();
      expect(instagramLink?.href).toBe(
        'https://www.instagram.com/95_harshsandhu/'
      );
      expect(instagramLink?.label).toBe('Instagram');
      expect(instagramLink?.icon).toBe(InstagramIcon);
    });

    it('should have required properties for each social link', () => {
      SOCIAL_LINKS.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('href');
        expect(link).toHaveProperty('icon');
        expect(typeof link.label).toBe('string');
        expect(typeof link.href).toBe('string');
        expect(typeof link.icon).toBe('function');
        expect(link.href.startsWith('http')).toBe(true);
      });
    });
  });

  describe('PROJECTS', () => {
    it('should be an array with correct structure', () => {
      expect(Array.isArray(PROJECTS)).toBe(true);
      expect(PROJECTS).toHaveLength(1);
    });

    it('should contain MoodSync project with all required properties', () => {
      const moodSyncProject = PROJECTS[0];

      expect(moodSyncProject.label).toBe(
        'MoodSync - A Mood-Adaptive Sound Frequency App'
      );
      expect(moodSyncProject.slug).toBe('mood-sync');
      expect(moodSyncProject.href).toBe('/projects/mood-sync');
      expect(moodSyncProject.description).toContain(
        'mood-adaptive sound frequency app'
      );
      expect(moodSyncProject.image).toBe('/images/mood-sync.png');
      expect(moodSyncProject.github).toBe(
        'https://github.com/harshsandhu44/mood-sync'
      );
      expect(moodSyncProject.live).toBe('https://moodsync.harshsandhu.com/');
    });

    it('should have correct technologies array', () => {
      const moodSyncProject = PROJECTS[0];
      const expectedTechnologies = [
        'React',
        'Next.js',
        'Tailwind CSS',
        'TypeScript',
        'Web Audio API',
      ];

      expect(Array.isArray(moodSyncProject.technologies)).toBe(true);
      expect(moodSyncProject.technologies).toEqual(expectedTechnologies);
      expect(moodSyncProject.technologies).toHaveLength(5);
    });

    it('should have required properties for each project', () => {
      PROJECTS.forEach((project) => {
        expect(project).toHaveProperty('label');
        expect(project).toHaveProperty('slug');
        expect(project).toHaveProperty('href');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('image');
        expect(project).toHaveProperty('technologies');
        expect(project).toHaveProperty('github');
        expect(project).toHaveProperty('live');

        expect(typeof project.label).toBe('string');
        expect(typeof project.slug).toBe('string');
        expect(typeof project.href).toBe('string');
        expect(typeof project.description).toBe('string');
        expect(typeof project.image).toBe('string');
        expect(typeof project.github).toBe('string');
        expect(typeof project.live).toBe('string');
        expect(Array.isArray(project.technologies)).toBe(true);

        expect(project.github.startsWith('http')).toBe(true);
        expect(project.live.startsWith('http')).toBe(true);
      });
    });
  });
});
