import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type AccountWeightProps = {
  initialWeights: Array<{ subnet: string; weight: number }>;
  connectedAccount: string;
  subnet: string;
  weight: string;
  setSelectedSubnet: (subnet: string | null) => void;
  setWeight: (weight: string) => void;
};

export default function AccountWeights({
  initialWeights,
  connectedAccount,
  subnet,
  weight,
  setSelectedSubnet,
  setWeight,
}: AccountWeightProps) {
  const [weights, setWeights] = useState(initialWeights);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = useMemo(() => {
    return weights.reduce((sum, item) => sum + item.weight, 0);
  }, [weights]);

  const removeSubnetWeight = (subnetToRemove: string) => {
    const updatedWeights = weights.filter(
      (item) => item.subnet !== subnetToRemove,
    );
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const adjustSubnetWeight = () => {
    if (subnet && weight && Number(weight) > 0) {
      const newWeight = Number(parseFloat(weight).toFixed(2));
      const existingIndex = weights.findIndex((sw) => sw.subnet === subnet);

      let updatedWeights;
      if (existingIndex !== -1) {
        // Update existing subnet weight
        updatedWeights = weights.map((item, index) =>
          index === existingIndex ? { ...item, weight: newWeight } : item,
        );
      } else {
        // Add new subnet weight
        updatedWeights = [...weights, { subnet: subnet, weight: newWeight }];
      }

      setWeights(updatedWeights);
      setHasChanges(true);
      setSelectedSubnet(null);
      setWeight("");
    }
  };

  const applyWeightsMutation = api.weights.addDelegateWeights.useMutation({
    onSuccess: () => {
      toast.success("Weights applied successfully");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Error applying weights: ${error.message}`);
    },
  });

  return (
    <>
      <div className="flex flex-col items-center justify-between space-y-4 py-5 sm:flex-row sm:space-y-0">
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
        <p className="text-sm text-gray-600">{100 - totalWeight}% Remaining</p>
      </div>
      <ul className="max-h-32 overflow-y-auto">
        {weights.map((item) => (
          <li
            key={item.subnet}
            className="flex items-center justify-between pb-2"
          >
            <span className="text-sm text-gray-700">
              <span className="font-mono">{item.weight}% </span>
              {item.subnet}
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
      <div className="pt-5">
        <button
          type="button"
          disabled={!hasChanges || totalWeight !== 100 || !connectedAccount}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (connectedAccount) {
              applyWeightsMutation.mutate({
                ss58: connectedAccount,
                weights: weights.map(({ subnet, weight }) => ({
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
