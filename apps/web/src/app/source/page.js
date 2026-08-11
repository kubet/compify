export const metadata = {
  title: "Corresponding Source",
  description: "Source and licensing information for the Compify service.",
};

export default function SourcePage() {
  const repositoryCandidate = process.env.NEXT_PUBLIC_SOURCE_REPOSITORY?.trim();
  const repository =
    repositoryCandidate && /^https:\/\//i.test(repositoryCandidate)
      ? repositoryCandidate.replace(/\/$/, "")
      : "https://github.com/kubet/compify";
  const revision = process.env.NEXT_PUBLIC_SOURCE_REVISION?.trim();
  const candidateUrl = process.env.NEXT_PUBLIC_SOURCE_URL?.trim();
  const configuredUrl =
    candidateUrl && /^https:\/\//i.test(candidateUrl) ? candidateUrl : null;
  const validRevision =
    revision && /^[0-9a-f]{40}$/i.test(revision) ? revision : null;
  const hasPinnedSource = Boolean(configuredUrl || validRevision);
  const sourceUrl =
    configuredUrl ||
    (validRevision ? `${repository}/tree/${validRevision}` : repository);
  const legalRevision = validRevision || "main";

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-6 py-16 text-gray-200">
      <h1 className="mb-6 text-4xl font-bold text-white">Source code</h1>
      <p className="mb-5 leading-7 text-gray-300">
        The original Compify code used by this service is licensed under the GNU
        Affero General Public License v3.0 only.
      </p>
      {hasPinnedSource ? (
        <p className="mb-5 leading-7 text-gray-300">
          This deployment&apos;s Corresponding Source and complete license
          notices are available below.
        </p>
      ) : (
        <p className="mb-5 leading-7 text-amber-300">
          This unpinned development build links to the upstream repository. A
          production operator must configure an immutable source URL or exact
          source revision for its deployed version and modifications.
        </p>
      )}
      <p className="mb-8 leading-7 text-gray-300">
        Third-party components retain their own licenses. Earlier Compify copies
        validly released under MIT retain that prior grant.
      </p>
      <a
        className="inline-flex rounded-lg border border-white/20 px-5 py-3 font-medium text-white underline hover:bg-white/5"
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Get the source{validRevision ? ` (${validRevision.slice(0, 12)})` : ""}
      </a>
      <div className="mt-8 flex flex-wrap gap-5 text-sm">
        <a
          className="text-gray-300 underline hover:text-white"
          href={`${repository}/blob/${legalRevision}/LICENSE`}
        >
          AGPL license
        </a>
        <a
          className="text-gray-300 underline hover:text-white"
          href={`${repository}/blob/${legalRevision}/LICENSING.md`}
        >
          Licensing details
        </a>
        <a
          className="text-gray-300 underline hover:text-white"
          href={`${repository}/blob/${legalRevision}/THIRD_PARTY_NOTICES.md`}
        >
          Third-party notices
        </a>
      </div>
    </main>
  );
}
