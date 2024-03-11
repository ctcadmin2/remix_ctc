interface bnr {
  date: string;
  query_date: string;
  rate: string;
}

//TODO swich to prod api

const bnrRate = async (date: string, currency: string) => {
  const url = `https://api.openapi.ro/api/exchange/${currency}?date=${
    date.split("T")[0]
  }`;

  const res = await fetch(url, {
    headers: {
      "x-api-key": `${process.env.OPENAPI_KEY}`,
    },
  });

  const data: bnr = await res.json();
  return data;
};

export default bnrRate;
