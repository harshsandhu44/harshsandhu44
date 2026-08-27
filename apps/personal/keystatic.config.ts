import { config, collection, singleton, fields } from "@keystatic/core";

/* Git-backed. Local means edits are plain file writes; GitHub means the
 * /keystatic UI opens commits against the repo. Either way content lands in the
 * repo, which is what lets the shell's vfs read it synchronously at build time.
 *
 * GitHub mode needs a GitHub App (KEYSTATIC_GITHUB_CLIENT_ID / _CLIENT_SECRET /
 * KEYSTATIC_SECRET). Gating on those rather than on NODE_ENV keeps the build
 * green before the app exists: without them Keystatic throws at build time, and
 * a missing CMS login should not be able to stop a deploy. Reading content
 * never goes through storage mode at all. */
const hasGithubApp = Boolean(
  process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
  process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
  process.env.KEYSTATIC_SECRET,
);

const storage = hasGithubApp
  ? ({ kind: "github", repo: "harshsandhu44/harshsandhu44" } as const)
  : ({ kind: "local" } as const);

const link = fields.object({
  label: fields.text({ label: "Label" }),
  href: fields.url({ label: "URL" }),
});

const stack = fields.array(fields.text({ label: "Technology" }), {
  label: "Stack",
  itemLabel: (props) => props.value,
});

export default config({
  storage,
  ui: { brand: { name: "harshsandhu.com" } },
  singletons: {
    profile: singleton({
      label: "Profile",
      path: "content/profile",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Name" }),
        role: fields.text({ label: "Role" }),
        tagline: fields.text({ label: "Tagline" }),
        location: fields.text({ label: "Location" }),
        email: fields.text({ label: "Email" }),
        phone: fields.text({ label: "Phone" }),
        website: fields.text({ label: "Website" }),
        summary: fields.text({ label: "Summary", multiline: true }),
        links: fields.array(link, {
          label: "Links",
          itemLabel: (props) => props.fields.label.value,
        }),
      },
    }),
    skills: singleton({
      label: "Skills",
      path: "content/skills",
      format: { data: "json" },
      schema: {
        groups: fields.array(
          fields.object({
            name: fields.text({ label: "Group" }),
            items: stack,
          }),
          { label: "Groups", itemLabel: (props) => props.fields.name.value },
        ),
      },
    }),
  },
  collections: {
    experience: collection({
      label: "Experience",
      path: "content/experience/*",
      slugField: "company",
      format: { data: "json" },
      columns: ["company", "role", "start"],
      schema: {
        company: fields.slug({ name: { label: "Company" } }),
        role: fields.text({ label: "Role" }),
        start: fields.text({ label: "Start", description: "YYYY.MM" }),
        end: fields.text({
          label: "End",
          description: "YYYY.MM, or blank if current",
        }),
        location: fields.text({ label: "Location" }),
        mode: fields.text({
          label: "Mode",
          description: "Remote / Hybrid / On-site",
        }),
        order: fields.integer({
          label: "Order",
          description: "Lower is more recent",
        }),
        bullets: fields.array(
          fields.text({ label: "Bullet", multiline: true }),
          {
            label: "Bullets",
            itemLabel: (props) => props.value.slice(0, 60),
          },
        ),
        stack,
      },
    }),
    projects: collection({
      label: "Projects",
      path: "content/projects/*",
      slugField: "name",
      format: { contentField: "body" },
      columns: ["name", "year", "featured"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        year: fields.text({ label: "Year" }),
        blurb: fields.text({ label: "Blurb", multiline: true }),
        href: fields.text({ label: "URL" }),
        featured: fields.checkbox({ label: "Featured", defaultValue: false }),
        order: fields.integer({ label: "Order" }),
        stack,
        body: fields.mdx({ label: "Case study" }),
      },
    }),
    education: collection({
      label: "Education",
      path: "content/education/*",
      slugField: "institution",
      format: { data: "json" },
      columns: ["institution", "degree", "start"],
      schema: {
        institution: fields.slug({ name: { label: "Institution" } }),
        degree: fields.text({ label: "Degree" }),
        field: fields.text({ label: "Field" }),
        location: fields.text({ label: "Location" }),
        start: fields.text({ label: "Start" }),
        end: fields.text({ label: "End" }),
        order: fields.integer({ label: "Order" }),
      },
    }),
  },
});
