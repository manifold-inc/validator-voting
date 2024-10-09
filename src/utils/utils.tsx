export const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}
