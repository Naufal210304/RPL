const Loader = () => {
  return (
    <div
      className="w-10 h-10 animate-db2"
      style={{
        "--c": "linear-gradient(#766DF4 0 0)",
        "--r1": "radial-gradient(farthest-side at bottom,#766DF4 93%,#0000)",
        "--r2": "radial-gradient(farthest-side at top,#766DF4 93%,#0000)",
        background: `
          var(--c),
          var(--r1),
          var(--r2),
          var(--c),
          var(--r1),
          var(--r2),
          var(--c),
          var(--r1),
          var(--r2)
        `,
        backgroundRepeat: "no-repeat",
      }}
    ></div>
  );
};

export default Loader;
