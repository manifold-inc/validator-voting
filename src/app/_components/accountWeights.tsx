import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type AccountWeightProps = {
  accountWeights: Array<{ subnet: string; weight: number }>;
  isLoading: boolean;
  connectedAccount: string;
  subnet: string;
  weight: string;
  setSelectedSubnet: (subnet: string | null) => void;
  setWeight: (weight: string) => void;
};

export default function AccountWeights({
  accountWeights,
  isLoading,
  connectedAccount,
  subnet,
  weight,
  setSelectedSubnet,
  setWeight,
}: AccountWeightProps) {
  const [localWeights, setLocalWeights] = useState(accountWeights);
  const [totalWeight, setTotalWeight] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalWeights(accountWeights);
    calculateTotalWeight(accountWeights);
    setHasChanges(false);
  }, [accountWeights]);

  const calculateTotalWeight = (
    weights: Array<{ subnet: string; weight: number }>,
  ) => {
    const total = weights.reduce((sum, item) => sum + item.weight, 0);
    setTotalWeight(total);
  };

  const removeSubnetWeight = (subnetToRemove: string) => {
    const updatedWeights = localWeights.filter(
      (item) => item.subnet !== subnetToRemove,
    );
    setLocalWeights(updatedWeights);
    calculateTotalWeight(updatedWeights);
    setHasChanges(true);
  };

  const adjustSubnetWeight = () => {
    if (subnet && weight && Number(weight) > 0) {
      const newWeight = Number(parseFloat(weight).toFixed(2));
      const existingIndex = localWeights.findIndex(
        (sw) => sw.subnet === subnet,
      );

      let updatedWeights;
      if (existingIndex !== -1) {
        // Update existing subnet weight
        updatedWeights = localWeights.map((item, index) =>
          index === existingIndex ? { ...item, weight: newWeight } : item,
        );
      } else {
        // Add new subnet weight
        updatedWeights = [
          ...localWeights,
          { subnet: subnet, weight: newWeight },
        ];
      }

      setLocalWeights(updatedWeights);
      setHasChanges(true);
      calculateTotalWeight(updatedWeights);
      setSelectedSubnet(null);
      setWeight("");
    }
  };

  const applyWeightsMutation = api.weights.addDelegateWeights.useMutation({
    onSuccess: () => {
      toast.success("Weights applied successfully");
    },
    onError: (error) => {
      toast.error(`Error applying weights: ${error.message}`);
    },
  });

  return (
    <>
      <p className="pt-4 text-center text-lg font-medium leading-6 text-black sm:text-left">
        {isLoading ? (
          <>
            Loading weights for{" "}
            <span className="font-mono">
              {`${connectedAccount?.slice(0, 5)}...${connectedAccount?.slice(-5)}`}
            </span>
          </>
        ) : (
          <>
            Subnet Weights for{" "}
            <span className="font-mono">
              {`${connectedAccount?.slice(0, 5)}...${connectedAccount?.slice(-5)}`}
            </span>
          </>
        )}
      </p>
      <ul className="max-h-32 overflow-y-auto">
        {localWeights.map((item) => (
          <li
            key={item.subnet}
            className="flex items-center justify-between pb-2"
          >
            <span className="text-sm text-gray-700">
              {item.weight}% {item.subnet}
            </span>
            <button
              onClick={() => removeSubnetWeight(item.subnet)}
              className="text-sm text-red-400 hover:text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
        <button
          type="button"
          onClick={adjustSubnetWeight}
          disabled={
            !subnet || !weight || Number(weight) <= 0 || Number(weight) > 100
          }
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Adjust Weight for Subnet
        </button>
        <p className="text-sm text-gray-700">Remaining: {100 - totalWeight}%</p>
      </div>
      <div>
        <button
          type="button"
          disabled={!hasChanges || totalWeight !== 100 || !connectedAccount}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (connectedAccount) {
              applyWeightsMutation.mutate({
                connected_account: connectedAccount,
                weights: localWeights.map(({ subnet, weight }) => ({
                  subnet,
                  weight,
                })),
              });
            } else {
              toast.error("Please connect your wallet first");
            }
          }}
        >
          Apply Weights
        </button>
      </div>
    </>
  );
}
