export const queryDiseaseDetails = async (className) => {
  const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
          query GetDisease($name: String!) {
            disease(name: $name) {
              name
              symptoms
              treatment
            }
          }
        `,
      variables: { name: className },
    }),
  });

  if (!response.ok) throw new Error("GraphQL query failed");
  const { data } = await response.json();
  return data.disease;
};
