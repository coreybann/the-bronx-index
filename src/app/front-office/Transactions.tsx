"use client";

import { useEffect, useMemo, useState } from "react";

type Transaction = {
  id: number;
  date: string;
  typeDesc?: string;
  description?: string;
  person?: {
    id: number;
    fullName: string;
  };
};

type Category =
  | "All"
  | "Trades"
  | "Signings"
  | "Roster Moves"
  | "Departures"
  | "Other";

const categories: Category[] = [
  "All",
  "Trades",
  "Signings",
  "Roster Moves",
  "Departures",
  "Other",
];

function getCategory(type: string): Category {
  if (type === "Trade") return "Trades";

  if (type === "Signed" || type === "Signed as Free Agent") {
    return "Signings";
  }

  if (
    [
      "Released",
      "Declared Free Agency",
      "Designated for Assignment",
    ].includes(type)
  ) {
    return "Departures";
  }

  if (
    [
      "Status Change",
      "Optioned",
      "Recalled",
      "Selected",
      "Outrighted",
      "Claimed Off Waivers",
      "Returned",
    ].includes(type)
  ) {
    return "Roster Moves";
  }

  return "Other";
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

export default function Transactions() {
  const [season, setSeason] = useState(() =>
    new Date().getFullYear()
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTransactions() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/yankees-transactions?season=${season}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load transactions.");
        }

        const data = (await response.json()) as {
          transactions: Transaction[];
        };

        if (!controller.signal.aborted) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load transactions."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => controller.abort();
  }, [season]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type = transaction.typeDesc ?? "";
      const description = transaction.description ?? "";
      const player = transaction.person?.fullName ?? "";

      const matchesCategory =
        category === "All" || getCategory(type) === category;

      const matchesSearch =
        !query ||
        `${description} ${player} ${type}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [transactions, category, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const visibleTransactions = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-white">
          Yankees <span className="text-[#d5b66a]">Transactions</span>
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          Explore Yankees trades, signings, roster moves, and
          departures. Transaction information is sourced from MLB.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search players or transactions..."
          aria-label="Search transactions"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#d5b66a] focus:outline-none"
        />

        <select
          value={season}
          onChange={(event) => {
            setSeason(Number(event.target.value));
            setPage(1);
          }}
          aria-label="Transaction season"
          className="rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white"
        >
          {Array.from(
            { length: new Date().getFullYear() - 2021 },
            (_, index) => new Date().getFullYear() - index
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setPage(1);
            }}
            aria-pressed={category === item}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              category === item
                ? "border-[#d5b66a] bg-[#d5b66a]/10 text-[#d5b66a]"
                : "border-white/10 bg-[#0b1d36] text-slate-400 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">
          Loading Yankees transactions...
        </p>
      ) : error ? (
        <p role="alert" className="py-12 text-center text-red-400">
          {error}
        </p>
      ) : (
        <>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {filtered.length} transactions
          </p>

          <div className="space-y-3">
            {visibleTransactions.map((transaction) => {
              const type = transaction.typeDesc ?? "Other";
              const transactionCategory = getCategory(type);

              return (
                <article
                  key={transaction.id}
                  className="rounded-xl border border-white/10 bg-[#0b1d36] p-5 transition hover:border-[#d5b66a]/40"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">
                      {formatDate(transaction.date)}
                    </span>

                    <span className="rounded-md border border-[#d5b66a]/30 bg-[#d5b66a]/10 px-2.5 py-1 text-xs font-bold text-[#d5b66a]">
                      {transactionCategory}
                    </span>

                    <span className="text-xs text-slate-500">
                      {type}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-slate-200">
                    {transaction.description ||
                      "Transaction details unavailable."}
                  </p>
                </article>
              );
            })}
          </div>

          {filtered.length > pageSize && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <p className="py-12 text-center text-slate-400">
              No transactions match your filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
