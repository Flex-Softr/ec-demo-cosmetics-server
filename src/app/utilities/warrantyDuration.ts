export const warrantyDuration = (duration: {
  quantity: string;
  unit: string;
}) => {
  const date = new Date(); // Get the current date as the starting point

  function addDurationToDate(duration: { quantity: string; unit: string }) {
    const number = parseInt(duration.quantity);
    const unit = duration.unit;

    // Calculate the end date based on the unit
    const endDate = new Date(date);
    switch (unit.toLowerCase()) {
      case "day":
      case "days":
        endDate.setDate(date.getDate() + number);
        break;
      case "week":
      case "weeks":
        endDate.setDate(date.getDate() + number * 7);
        break;
      case "month":
      case "months":
        endDate.setMonth(date.getMonth() + number);
        break;
      case "year":
      case "years":
        endDate.setFullYear(date.getFullYear() + number);
        break;
      default:
        return null;
    }
    return endDate;
  }

  const startDate = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDate = addDurationToDate(duration)?.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { startDate, endDate };
};
