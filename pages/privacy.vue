<template>
  <UContainer class="py-12 space-y-8">
    <UCard>
      <template #header>
        <h1 class="text-3xl font-bold text-primary">Privacy Policy</h1>
        <p class="text-sm text-gray-400">Effective Date: September 2025</p>
      </template>

      <UCardSection class="prose prose-invert max-w-none">
        <p>
          AFTA values your privacy. We collect only the minimal information
          necessary to provide login, profile, and gameplay functionality.
        </p>

        <h2>Information We Collect</h2>
        <ul>
          <li>Email address (via Google login)</li>
          <li>Basic profile info such as name and avatar</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To authenticate you and log you into the app</li>
          <li>To personalize your experience in games and events</li>
          <li>To secure your account</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>
          We do not sell or share your data with third parties. Data is stored
          securely through Supabase and is only used for the purposes listed
          above.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at:
          <a href="mailto:rakeemxng@gmail.com" class="text-primary underline">
            rakeemxng@gmail.com
          </a>
        </p>
      </UCardSection>
    </UCard>
  </UContainer>
</template>
