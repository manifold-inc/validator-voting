import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type SubnetWeight = {
  subnet: string;
  weight: number;
};

type SubnetWeightsProps = {
  connectedAccount: string | null;
  selectedSubnet: string | null;
  weight: string;
  setSelectedSubnet: (subnet: string | null) => void;
  setWeight: (weight: string) => void;
};

export default function NoAccountWeights({
  connectedAccount,
  selectedSubnet,
  weight,
  setSelectedSubnet,
  setWeight,
}: SubnetWeightsProps) {
  const [subnetWeights, setSubnetWeights] = useState<SubnetWeight[]>([]);

  const addSubnetWeight = () => {
    if (selectedSubnet && weight && Number(weight) > 0) {
      const newWeight = Number(parseFloat(weight).toFixed(2));
      const existingIndex = subnetWeights.findIndex(
        (sw) => sw.subnet === selectedSubnet,
      );

      if (existingIndex !== -1) {
        // Update existing subnet weight
        const updatedWeights = [...subnetWeights];
        updatedWeights[existingIndex]!.weight = newWeight;
        setSubnetWeights(updatedWeights);
      } else {
        // Add new subnet weight
        setSubnetWeights([
          ...subnetWeights,
          { subnet: selectedSubnet, weight: newWeight },
        ]);
      }

      setSelectedSubnet(null);
      setWeight("");
    }
  };

  const removeSubnetWeight = (subnet: string) => {
    setSubnetWeights(subnetWeights.filter((sw) => sw.subnet !== subnet));
  };

  const totalWeight = subnetWeights.reduce((sum, sw) => sum + sw.weight, 0);

  useEffect(() => {
    if (totalWeight > 100) {
      toast.error("Total weight exceeds 100%");
    }
  }, [totalWeight]);

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
      <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
        <button
          type="button"
          onClick={addSubnetWeight}
          disabled={
            !selectedSubnet ||
            !weight ||
            Number(weight) <= 0 ||
            Number(weight) > 100
          }
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Add Weight to Subnet
        </button>
        <p className="text-sm text-gray-700">Remaining: {100 - totalWeight}%</p>
      </div>

      {subnetWeights.length > 0 && (
        <>
          <p className="pt-4 text-center text-lg font-medium leading-6 text-black sm:text-left">
            Added Subnet Weights
          </p>
          <ul className="max-h-32 overflow-y-auto">
            {subnetWeights.map((item) => (
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
        </>
      )}

      <div>
        <button
          type="button"
          disabled={totalWeight !== 100 || !connectedAccount}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (connectedAccount) {
              applyWeightsMutation.mutate({
                connected_account: connectedAccount,
                weights: subnetWeights.map(({ subnet, weight }) => ({
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
