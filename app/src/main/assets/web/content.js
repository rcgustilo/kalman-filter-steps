/* Kalman Filter Steps — lesson content. */
var R = String.raw;
var APP_TITLE = "Kalman Filter Steps", APP_KEY = "kfSteps.v1", APP_LOGO = "K";
var MODULES = [];

MODULES.push({ id: "m1", title: "Probability Refresher", icon: "🎲",
  intro: "The language of uncertainty: means, variances, covariances and the Gaussian.",
  lessons: [
    { id: "m1l1", title: "Random variables and the Gaussian",
      body: R`<p>A sensor reading is a <b>random variable</b>: repeat the measurement and you get slightly different numbers. We describe it by its <b>mean</b> (centre) and <b>variance</b> (spread):</p>
$$\mu = E[x],\qquad \sigma^2 = E\big[(x-\mu)^2\big]$$
<p>The standard deviation $\sigma$ has the same units as $x$. Most sensor noise is well described by the <b>Gaussian (normal)</b> distribution:</p>
$$p(x) = \frac{1}{\sqrt{2\pi\sigma^2}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$
<table class="tbl"><tr><th>Range</th><th>Probability</th></tr>
<tr><td>$\mu \pm 1\sigma$</td><td>68.3%</td></tr><tr><td>$\mu \pm 2\sigma$</td><td>95.4%</td></tr><tr><td>$\mu \pm 3\sigma$</td><td>99.7%</td></tr></table>
<p><b>Example:</b> a thermometer reads 25.0 °C with $\sigma = 0.5$ °C, so the true temperature is in [24.0, 26.0] with about 95% probability.</p>
<p>Why Gaussians dominate: sums of many small independent effects tend to be Gaussian (central limit theorem), and Gaussians stay Gaussian under linear operations. That is exactly what makes the Kalman filter exact.</p>`,
      formulas: [{ name: "Mean and variance", tex: R`\mu=E[x],\ \ \sigma^2=E[(x-\mu)^2]` }, { name: "Gaussian density", tex: R`p(x)=\dfrac1{\sqrt{2\pi\sigma^2}}e^{-(x-\mu)^2/2\sigma^2}` }],
      quiz: [
        { q: "About what fraction of Gaussian samples fall within ±2σ of the mean?", options: ["68%", "95%", "99.7%", "50%"], a: 1, why: "95.4%." },
        { q: "A sensor has variance 0.04 V². Its standard deviation is…", options: ["0.04 V", "0.2 V", "0.0016 V", "4 V"], a: 1, why: R`$\sqrt{0.04}=0.2$.` }
      ] },
    { id: "m1l2", title: "Covariance and correlation",
      body: R`<p>With several variables (position and velocity, say), we also need how they <b>vary together</b>. The <b>covariance</b>:</p>
$$\operatorname{cov}(x,y) = E\big[(x-\mu_x)(y-\mu_y)\big]$$
<p>and the dimensionless <b>correlation</b> $\rho = \dfrac{\operatorname{cov}(x,y)}{\sigma_x\sigma_y}\in[-1,1]$.</p>
<p>For a vector $\mathbf x$, the <b>covariance matrix</b> collects all of them:</p>
$$P = E\big[(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^\top\big] = \begin{pmatrix}\sigma_1^2 & \rho\sigma_1\sigma_2\\ \rho\sigma_1\sigma_2 & \sigma_2^2\end{pmatrix}$$
<p>Properties: symmetric, positive semidefinite, variances on the diagonal.</p>
<p>In the Kalman filter, $P$ is the filter's own estimate of <b>how wrong it might be</b>. Off-diagonal terms matter: if position and velocity errors are correlated, a position measurement also corrects the velocity estimate, even though velocity is never measured.</p>`,
      formulas: [{ name: "Covariance", tex: R`\mathrm{cov}(x,y)=E[(x-\mu_x)(y-\mu_y)]` }, { name: "Correlation", tex: R`\rho=\dfrac{\mathrm{cov}(x,y)}{\sigma_x\sigma_y}` }, { name: "Covariance matrix", tex: R`P=E[(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^\top]` }],
      quiz: [
        { q: "The diagonal entries of a covariance matrix are…", options: ["Correlations", "Variances", "Means", "Always zero"], a: 1, why: "Each diagonal entry is a variable's variance." },
        { q: "Why can a Kalman filter estimate velocity from position measurements alone?", options: ["Magic", "Through the correlation between position and velocity errors in P", "It cannot", "Because R = 0"], a: 1, why: "Off-diagonal covariance terms let corrections spread." }
      ] },
    { id: "m1l3", title: "Linear transformations of Gaussians",
      body: R`<p>If $\mathbf x \sim \mathcal N(\boldsymbol\mu, P)$ and $\mathbf y = A\mathbf x + \mathbf b$, then $\mathbf y$ is also Gaussian with</p>
$$E[\mathbf y] = A\boldsymbol\mu + \mathbf b,\qquad \operatorname{cov}(\mathbf y) = A P A^\top$$
<p>This one rule is the Kalman <b>prediction step</b>: pushing the state through $\mathbf x_k = F\mathbf x_{k-1}$ transforms its covariance into $FPF^\top$.</p>
<p>Adding independent noise adds covariances:</p>
$$\operatorname{cov}(\mathbf x + \mathbf w) = P + Q\quad(\mathbf x,\mathbf w\ \text{independent})$$
<p><b>Example:</b> position $p$ and velocity $v$ with $P = \operatorname{diag}(1, 4)$, time step $T = 1$: $p' = p + v$. Then</p>
$$\operatorname{var}(p') = 1 + 4 = 5$$
<p>The position becomes more uncertain because the velocity is uncertain: uncertainty <b>grows</b> during prediction.</p>`,
      formulas: [{ name: "Linear transform", tex: R`\mathbf y=A\mathbf x+\mathbf b\Rightarrow\mathcal N(A\boldsymbol\mu+\mathbf b,\ APA^\top)` }, { name: "Independent sum", tex: R`\mathrm{cov}(\mathbf x+\mathbf w)=P+Q` }],
      quiz: [
        { q: R`If $x\sim\mathcal N(0,4)$ and $y=3x$, what is var(y)?`, options: ["12", "36", "4", "9"], a: 1, why: R`$3^2\times4=36$.` },
        { q: "During the prediction step, uncertainty usually…", options: ["Shrinks", "Grows", "Stays the same", "Becomes zero"], a: 1, why: R`$FPF^\top+Q$ adds process noise.` }
      ] },
    { id: "m1l4", title: "Bayes' rule for estimation",
      body: R`<p>Estimation combines what we believed before (the <b>prior</b>) with what a measurement tells us (the <b>likelihood</b>) to get an updated belief (the <b>posterior</b>):</p>
$$p(x\mid z) = \frac{p(z\mid x)\,p(x)}{p(z)}\ \propto\ \text{likelihood}\times\text{prior}$$
<p>When prior and likelihood are Gaussian, the posterior is Gaussian too, and its mean and variance have closed forms (next module). That is the whole Kalman filter: Bayes' rule, applied recursively, for linear-Gaussian systems.</p>
<table class="tbl"><tr><th>Filter</th><th>Represents belief by</th><th>Exact for</th></tr>
<tr><td>Kalman filter</td><td>Mean and covariance</td><td>Linear, Gaussian</td></tr>
<tr><td>EKF / UKF</td><td>Mean and covariance (approximate)</td><td>Mildly nonlinear</td></tr>
<tr><td>Particle filter</td><td>Weighted samples</td><td>Any (with enough particles)</td></tr>
<tr><td>Grid / histogram filter</td><td>Probability on a grid</td><td>Low-dimensional</td></tr></table>`,
      formulas: [{ name: "Bayes' rule", tex: R`p(x|z)=\dfrac{p(z|x)p(x)}{p(z)}` }, { name: "Recursive Bayes filter", tex: R`p(x_k|z_{1:k})\propto p(z_k|x_k)\int p(x_k|x_{k-1})p(x_{k-1}|z_{1:k-1})dx_{k-1}` }],
      quiz: [
        { q: "In Bayes' rule, the posterior is proportional to…", options: ["Prior + likelihood", "Likelihood × prior", "Prior / likelihood", "Likelihood only"], a: 1, why: R`$p(x|z)\propto p(z|x)p(x)$.` },
        { q: "The Kalman filter is exact when the system is…", options: ["Nonlinear, non-Gaussian", "Linear with Gaussian noise", "Discrete-event", "Chaotic"], a: 1, why: "Gaussians stay Gaussian under linear maps and Bayes updates." }
      ] }
  ] });

MODULES.push({ id: "m2", title: "Estimation Basics", icon: "🎯",
  intro: "Least squares, recursive averaging and fusing two measurements: the seeds of the Kalman filter.",
  lessons: [
    { id: "m2l1", title: "Least squares and weighted least squares",
      body: R`<p>Measurements $\mathbf z = H\mathbf x + \mathbf v$ of an unknown constant $\mathbf x$. <b>Least squares</b> chooses $\hat{\mathbf x}$ to minimize $\|\mathbf z - H\hat{\mathbf x}\|^2$:</p>
$$\hat{\mathbf x} = (H^\top H)^{-1}H^\top\mathbf z$$
<p>If some sensors are more accurate, weight them by the inverse of their noise covariance $R$: <b>weighted least squares</b>,</p>
$$\hat{\mathbf x} = (H^\top R^{-1}H)^{-1}H^\top R^{-1}\mathbf z,\qquad \operatorname{cov}(\hat{\mathbf x}) = (H^\top R^{-1}H)^{-1}$$
<p><b>Example:</b> two measurements of one quantity, $z_1 = 10$ (variance 4) and $z_2 = 12$ (variance 1). Then $H = [1,1]^\top$, $R=\operatorname{diag}(4,1)$:</p>
$$\hat x = \frac{10/4 + 12/1}{1/4 + 1/1} = \frac{14.5}{1.25} = 11.6,\qquad \operatorname{var}(\hat x) = \frac{1}{1.25} = 0.8$$
<p>The estimate leans toward the better sensor, and its variance (0.8) is smaller than either sensor's.</p>`,
      formulas: [{ name: "Least squares", tex: R`\hat{\mathbf x}=(H^\top H)^{-1}H^\top\mathbf z` }, { name: "Weighted least squares", tex: R`\hat{\mathbf x}=(H^\top R^{-1}H)^{-1}H^\top R^{-1}\mathbf z` }],
      quiz: [
        { q: "Weighted least squares weights each measurement by…", options: ["Its size", "The inverse of its noise variance", "Its time stamp", "Randomly"], a: 1, why: "More accurate sensors get more weight." },
        { q: "Combining two independent measurements gives a variance that is…", options: ["Larger than both", "Smaller than both", "Their average", "Their sum"], a: 1, why: R`$1/\sigma^2=1/\sigma_1^2+1/\sigma_2^2$.` }
      ] },
    { id: "m2l2", title: "Recursive averaging",
      body: R`<p>The average of $k$ measurements can be updated <b>without storing</b> all of them:</p>
$$\hat x_k = \hat x_{k-1} + \frac{1}{k}\big(z_k - \hat x_{k-1}\big)$$
<p>Read it as: <b>new estimate = old estimate + gain × (measurement − prediction)</b>. This “predictor–corrector” form is exactly the shape of the Kalman update. The term $z_k - \hat x_{k-1}$ is the <b>innovation</b>, the new information in the measurement.</p>
<p>The gain $1/k$ shrinks as confidence grows: early measurements move the estimate a lot, later ones only a little. The variance of the average falls as</p>
$$\operatorname{var}(\hat x_k) = \frac{\sigma^2}{k}$$
<p>If the quantity can drift, a constant gain $\alpha$ (exponential smoothing) keeps tracking:</p>
$$\hat x_k = \hat x_{k-1} + \alpha\big(z_k - \hat x_{k-1}\big)$$
<p>The Kalman filter chooses this gain optimally at each step.</p>`,
      formulas: [{ name: "Recursive mean", tex: R`\hat x_k=\hat x_{k-1}+\tfrac1k(z_k-\hat x_{k-1})` }, { name: "Variance of the mean", tex: R`\mathrm{var}(\hat x_k)=\sigma^2/k` }, { name: "Exponential smoothing", tex: R`\hat x_k=\hat x_{k-1}+\alpha(z_k-\hat x_{k-1})` }],
      quiz: [
        { q: "After 4 measurements with σ = 2, the standard deviation of the average is…", options: ["0.5", "1", "2", "4"], a: 1, why: R`$\sigma/\sqrt k=2/2=1$.` },
        { q: R`The term $z_k-\hat x_{k-1}$ is called the…`, options: ["Bias", "Innovation", "Gain", "Covariance"], a: 1, why: "It is the new information in the measurement." }
      ] },
    { id: "m2l3", title: "Fusing two Gaussian estimates",
      body: R`<p>Two independent Gaussian estimates of the same quantity, $\mathcal N(\mu_1,\sigma_1^2)$ and $\mathcal N(\mu_2,\sigma_2^2)$, multiply (Bayes) into a Gaussian with</p>
$$\mu = \frac{\sigma_2^2\,\mu_1 + \sigma_1^2\,\mu_2}{\sigma_1^2+\sigma_2^2},\qquad \sigma^2 = \frac{\sigma_1^2\sigma_2^2}{\sigma_1^2+\sigma_2^2}$$
<p>Rewrite it in gain form, with $K = \dfrac{\sigma_1^2}{\sigma_1^2+\sigma_2^2}$:</p>
$$\mu = \mu_1 + K(\mu_2 - \mu_1),\qquad \sigma^2 = (1-K)\,\sigma_1^2$$
<p>This <b>is</b> the one-dimensional Kalman update, with estimate 1 as the prediction and estimate 2 as the measurement.</p>
<p>Move the sliders: the fused curve (green) is always narrower than both inputs and sits closer to the more certain one.</p>`,
      widget: "fuse", widgetOpts: {},
      formulas: [{ name: "Fused mean", tex: R`\mu=\dfrac{\sigma_2^2\mu_1+\sigma_1^2\mu_2}{\sigma_1^2+\sigma_2^2}` }, { name: "Fused variance", tex: R`\sigma^2=\dfrac{\sigma_1^2\sigma_2^2}{\sigma_1^2+\sigma_2^2}` }, { name: "Gain form", tex: R`K=\dfrac{\sigma_1^2}{\sigma_1^2+\sigma_2^2},\ \ \mu=\mu_1+K(\mu_2-\mu_1)` }],
      quiz: [
        { q: "Fuse N(20, 9) and N(26, 9). The fused mean is…", options: ["20", "23", "26", "24"], a: 1, why: "Equal variances: the plain average, 23." },
        { q: "…and the fused variance is…", options: ["9", "4.5", "18", "3"], a: 1, why: "81/18 = 4.5." }
      ] },
    { id: "m2l4", title: "From fusion to filtering",
      body: R`<p>For a quantity that <b>changes</b> over time, alternate two steps forever:</p>
<table class="tbl"><tr><th>Step</th><th>What happens</th><th>Uncertainty</th></tr>
<tr><td><b>Predict</b></td><td>Use the model to move the estimate forward in time</td><td>Grows (process noise Q)</td></tr>
<tr><td><b>Update</b></td><td>Fuse the prediction with the new measurement</td><td>Shrinks (by measurement noise R)</td></tr></table>
$$\underbrace{\hat x_{k-1},P_{k-1}}_{\text{last estimate}}\ \xrightarrow{\text{predict}}\ \underbrace{\hat x_k^-,P_k^-}_{\text{prior}}\ \xrightarrow{\text{update with }z_k}\ \underbrace{\hat x_k,P_k}_{\text{posterior}}$$
<p>Rudolf Kálmán published this recursion in 1960. Within a few years, it guided the Apollo spacecraft to the Moon (Stanley Schmidt at NASA Ames developed the extended version for navigation), and it now runs in every smartphone, GPS receiver, drone and car.</p>
<p>Notation used in this course: a superscript minus ($\hat x^-$, $P^-$) means “before the measurement” (prior); no minus means “after” (posterior).</p>`,
      formulas: [{ name: "The Kalman cycle", tex: R`(\hat x_{k-1},P_{k-1})\xrightarrow{\text{predict}}(\hat x_k^-,P_k^-)\xrightarrow{\text{update}}(\hat x_k,P_k)` }],
      quiz: [
        { q: "During the update step, uncertainty…", options: ["Grows", "Shrinks", "Is unchanged", "Becomes infinite"], a: 1, why: "A measurement adds information." },
        { q: "Which mission famously used Kalman filtering for navigation in the 1960s?", options: ["Titanic", "Apollo", "Concorde", "Sputnik 1"], a: 1, why: "The Apollo navigation computer used an extended Kalman filter." }
      ] }
  ] });

MODULES.push({ id: "m3", title: "The 1D Kalman Filter", icon: "📈",
  intro: "The complete filter for a single variable: equations, tuning and steady state.",
  lessons: [
    { id: "m3l1", title: "The scalar model",
      body: R`<p>The Kalman filter needs a <b>process model</b> (how the state evolves) and a <b>measurement model</b> (what the sensor sees):</p>
$$x_k = a\,x_{k-1} + b\,u_{k-1} + w_{k-1},\qquad w\sim\mathcal N(0,Q)$$
$$z_k = h\,x_k + v_k,\qquad v\sim\mathcal N(0,R)$$
<table class="tbl"><tr><th>Symbol</th><th>Meaning</th><th>Example: room temperature</th></tr>
<tr><td>$a$</td><td>State transition</td><td>1 (temperature persists)</td></tr>
<tr><td>$b\,u$</td><td>Known input</td><td>Heater power effect</td></tr>
<tr><td>$Q$</td><td>Process noise variance: how much the true state wanders unpredictably</td><td>Drafts, people entering</td></tr>
<tr><td>$h$</td><td>Measurement gain</td><td>1</td></tr>
<tr><td>$R$</td><td>Measurement noise variance</td><td>Sensor spec, e.g. (0.5 °C)²</td></tr></table>
<p>$R$ usually comes from the sensor datasheet or from measuring a constant signal. $Q$ is harder: it describes how imperfect the model is, and is usually tuned.</p>`,
      formulas: [{ name: "Process model", tex: R`x_k=ax_{k-1}+bu_{k-1}+w_{k-1},\ \ w\sim\mathcal N(0,Q)` }, { name: "Measurement model", tex: R`z_k=hx_k+v_k,\ \ v\sim\mathcal N(0,R)` }],
      quiz: [
        { q: "Q describes…", options: ["Sensor noise", "How much the true state changes unpredictably (model error)", "The initial state", "The gain"], a: 1, why: "Process noise captures unmodelled changes." },
        { q: "A sensor with σ = 0.2 V has R = …", options: ["0.2", "0.04", "0.4", "5"], a: 1, why: R`$R=\sigma^2$.` }
      ] },
    { id: "m3l2", title: "Predict and update",
      body: R`<p><b>Predict</b> (time update):</p>
$$\hat x_k^- = a\,\hat x_{k-1} + b\,u_{k-1},\qquad P_k^- = a^2P_{k-1} + Q$$
<p><b>Update</b> (measurement update):</p>
$$K_k = \frac{P_k^-h}{h^2P_k^- + R}$$
$$\hat x_k = \hat x_k^- + K_k\big(z_k - h\,\hat x_k^-\big),\qquad P_k = (1-K_kh)\,P_k^-$$
<p>The gain $K$ balances trust: if the prediction is uncertain ($P^-$ large) or the sensor is good ($R$ small), $K \to 1/h$ and the filter follows the measurements; if the sensor is poor, $K\to0$ and the filter trusts its model.</p>
<p>The simulator tracks a slowly drifting value from noisy measurements. The shaded band is ±2σ from the filter's own $P$: about 95% of the time the truth should lie inside it.</p>`,
      widget: "kf1d", widgetOpts: {},
      formulas: [{ name: "Predict", tex: R`\hat x_k^-=a\hat x_{k-1}+bu,\ \ P_k^-=a^2P_{k-1}+Q` }, { name: "Kalman gain", tex: R`K_k=\dfrac{P_k^-h}{h^2P_k^-+R}` }, { name: "Update", tex: R`\hat x_k=\hat x_k^-+K_k(z_k-h\hat x_k^-),\ \ P_k=(1-K_kh)P_k^-` }],
      quiz: [
        { q: R`With $P^-=3$, $R=1$, $h=1$, the Kalman gain is…`, options: ["0.25", "0.75", "3", "1"], a: 1, why: "3/(3 + 1) = 0.75." },
        { q: "If the sensor becomes very noisy (R → ∞), K tends to…", options: ["1", "0", "∞", "0.5"], a: 1, why: "The filter ignores useless measurements." }
      ] },
    { id: "m3l3", title: "Tuning Q and R",
      body: R`<p>The <b>ratio</b> $Q/R$ sets the filter's behaviour:</p>
<table class="tbl"><tr><th>Setting</th><th>Behaviour</th><th>Risk</th></tr>
<tr><td>Q small, R large</td><td>Smooth, slow; trusts the model</td><td>Lags behind real changes</td></tr>
<tr><td>Q large, R small</td><td>Fast, noisy; trusts the sensor</td><td>Passes noise through</td></tr></table>
<p>Signs of mistuning:</p>
<ul><li><b>Q too small</b>: estimates lag, and the truth leaves the ±2σ band (the filter is overconfident).</li>
<li><b>Q too large</b>: estimates are nearly as noisy as the raw measurements.</li></ul>
<p>Practical method: set $R$ from sensor data, then increase $Q$ from a small value until the estimate follows real changes without passing too much noise. Then check innovation statistics (Module 5).</p>
<p>Try it in the simulator: add a sudden step in the true value and compare Q = 0.0001 with Q = 0.1.</p>`,
      widget: "kf1d", widgetOpts: { step: true },
      formulas: [{ name: "Tuning ratio", tex: R`Q/R\uparrow\Rightarrow\text{faster, noisier};\ \ Q/R\downarrow\Rightarrow\text{smoother, slower}` }],
      quiz: [
        { q: "The estimate lags behind a sudden change. You should…", options: ["Decrease Q", "Increase Q", "Increase R", "Set K = 0"], a: 1, why: "More process noise lets the filter react faster." },
        { q: "The truth often lies outside the ±2σ band. The filter is…", options: ["Well tuned", "Overconfident (P too small, Q likely too small)", "Too slow on purpose", "Diverging upward"], a: 1, why: "Real errors exceed what P claims." }
      ] },
    { id: "m3l4", title: "Steady state and the α filter",
      body: R`<p>For a constant model ($a = h = 1$), $P_k$ and $K_k$ converge quickly to constants. The steady-state prior variance solves</p>
$$P^- = \frac{P^-R}{P^-+R} + Q\ \Rightarrow\ P^- = \frac{Q + \sqrt{Q^2 + 4QR}}{2}$$
$$K_\infty = \frac{P^-}{P^-+R}$$
<p><b>Example:</b> $Q=1$, $R=4$: $P^- = (1+\sqrt{17})/2 \approx 2.56$, so $K_\infty \approx 0.39$.</p>
<p>A steady-state Kalman filter is just exponential smoothing with the optimal α:</p>
$$\hat x_k = \hat x_{k-1} + K_\infty(z_k - \hat x_{k-1})$$
<p>which is a first-order low-pass filter with cut-off depending on $Q/R$. Many embedded systems use the precomputed steady-state gain to save computation.</p>`,
      formulas: [{ name: "Steady-state prior variance", tex: R`P^-=\dfrac{Q+\sqrt{Q^2+4QR}}{2}` }, { name: "Steady-state gain", tex: R`K_\infty=\dfrac{P^-}{P^-+R}` }],
      quiz: [
        { q: "With Q = 2, R = 2, the steady-state prior variance P⁻ is…", options: ["2", "≈ 3.24", "4", "1"], a: 1, why: R`$(2+\sqrt{4+16})/2=(2+4.47)/2\approx3.24$.` },
        { q: "A steady-state scalar Kalman filter behaves like…", options: ["A high-pass filter", "Exponential smoothing / first-order low-pass", "A delay", "An integrator"], a: 1, why: "Constant gain on the innovation." }
      ] }
  ] });

MODULES.push({ id: "m4", title: "The Multivariate Kalman Filter", icon: "🧭",
  intro: "Vectors and matrices: tracking position and velocity together.",
  lessons: [
    { id: "m4l1", title: "State-space model with noise",
      body: R`<p>The general linear model:</p>
$$\mathbf x_k = F\mathbf x_{k-1} + G\mathbf u_{k-1} + \mathbf w_{k-1},\qquad \mathbf w\sim\mathcal N(0,Q)$$
$$\mathbf z_k = H\mathbf x_k + \mathbf v_k,\qquad \mathbf v\sim\mathcal N(0,R)$$
<p><b>Constant-velocity model</b> (sample time $T$), with state $(p, v)$ and only position measured:</p>
$$F = \begin{pmatrix}1 & T\\0&1\end{pmatrix},\qquad H = \begin{pmatrix}1&0\end{pmatrix}$$
<p>Unknown accelerations act as process noise. For white acceleration noise with spectral density $q$:</p>
$$Q = q\begin{pmatrix} T^3/3 & T^2/2\\ T^2/2 & T\end{pmatrix}$$
<p>This model is the starting point for radar tracking, GPS navigation and computer-vision object tracking.</p>`,
      formulas: [{ name: "Linear model", tex: R`\mathbf x_k=F\mathbf x_{k-1}+G\mathbf u+\mathbf w,\ \ \mathbf z_k=H\mathbf x_k+\mathbf v` }, { name: "Constant velocity", tex: R`F=\begin{pmatrix}1&T\\0&1\end{pmatrix},\ H=\begin{pmatrix}1&0\end{pmatrix}` }, { name: "Process noise (white acceleration)", tex: R`Q=q\begin{pmatrix}T^3/3&T^2/2\\T^2/2&T\end{pmatrix}` }],
      quiz: [
        { q: "In the constant-velocity model, what does F do?", options: ["Measures position", "Advances position by velocity × T", "Adds noise", "Computes the gain"], a: 1, why: R`$p_k=p_{k-1}+Tv_{k-1}$.` },
        { q: R`With $H=(1\ 0)$, the sensor measures…`, options: ["Velocity", "Position only", "Both", "Acceleration"], a: 1, why: "Only the first state appears." }
      ] },
    { id: "m4l2", title: "The five Kalman equations",
      body: R`<p><b>Predict:</b></p>
$$\hat{\mathbf x}_k^- = F\hat{\mathbf x}_{k-1} + G\mathbf u_{k-1}$$
$$P_k^- = FP_{k-1}F^\top + Q$$
<p><b>Update:</b></p>
$$K_k = P_k^-H^\top\big(HP_k^-H^\top + R\big)^{-1}$$
$$\hat{\mathbf x}_k = \hat{\mathbf x}_k^- + K_k\big(\mathbf z_k - H\hat{\mathbf x}_k^-\big)$$
$$P_k = (I - K_kH)\,P_k^-$$
<p>That's the entire filter. The matrix $S_k = HP_k^-H^\top + R$ is the <b>innovation covariance</b>: the expected spread of $\mathbf z_k - H\hat{\mathbf x}_k^-$.</p>
<table class="tbl"><tr><th>Quantity</th><th>Size (n states, m measurements)</th></tr>
<tr><td>$\hat{\mathbf x}, P$</td><td>n×1, n×n</td></tr><tr><td>$K$</td><td>n×m</td></tr><tr><td>$S$</td><td>m×m (the only matrix inverted)</td></tr></table>
<p>The filter is optimal: among all linear estimators it gives the minimum mean-square error, and for Gaussian noise it is optimal among <b>all</b> estimators.</p>`,
      formulas: [{ name: "State prediction", tex: R`\hat{\mathbf x}_k^-=F\hat{\mathbf x}_{k-1}+G\mathbf u` }, { name: "Covariance prediction", tex: R`P_k^-=FP_{k-1}F^\top+Q` }, { name: "Kalman gain", tex: R`K_k=P_k^-H^\top(HP_k^-H^\top+R)^{-1}` }, { name: "State update", tex: R`\hat{\mathbf x}_k=\hat{\mathbf x}_k^-+K_k(\mathbf z_k-H\hat{\mathbf x}_k^-)` }, { name: "Covariance update", tex: R`P_k=(I-K_kH)P_k^-` }],
      quiz: [
        { q: "Which matrix must be inverted in the Kalman update?", options: ["P (n×n)", "S = HP⁻Hᵀ + R (m×m)", "F", "Q"], a: 1, why: "Only the innovation covariance is inverted." },
        { q: "With 6 states and 2 measurements, K is…", options: ["2×6", "6×2", "6×6", "2×2"], a: 1, why: "n × m." }
      ] },
    { id: "m4l3", title: "Tracking a moving target",
      body: R`<p>The simulator applies a 2D constant-velocity Kalman filter (independent x and y, each with position and velocity) to a target moving on a curved path, observed by a noisy GPS-like sensor.</p>
<ul><li>Grey dots: raw measurements.</li>
<li>Blue line: the true path.</li>
<li>Orange line: the Kalman estimate.</li></ul>
<p>Notice how the filter smooths noise, estimates velocity (which is never measured), and lags slightly in tight turns, where the constant-velocity assumption is wrong.</p>
<p>Increase $q$ to follow turns better (at the cost of more noise); increase the measurement noise to see the filter work harder. The RMS errors of the raw measurements and the estimate are compared below the plot.</p>`,
      widget: "track", widgetOpts: {},
      formulas: [{ name: "RMS error", tex: R`\text{RMSE}=\sqrt{\tfrac1N\sum_k\|\hat{\mathbf p}_k-\mathbf p_k\|^2}` }],
      quiz: [
        { q: "Why does the filter lag in sharp turns?", options: ["The sensor stops working", "The constant-velocity model ignores acceleration", "K is zero", "Q is negative"], a: 1, why: "Turning needs acceleration the model treats as noise." },
        { q: "Velocity is estimated even though it is never measured because…", options: ["It is guessed randomly", "The model links position changes to velocity", "R = 0", "It is not estimated"], a: 1, why: "Through F and the correlations in P." }
      ] },
    { id: "m4l4", title: "Observability and the α–β filter",
      body: R`<p>The filter can only estimate states that affect the measurements, directly or through the dynamics. The system is <b>observable</b> if</p>
$$\mathcal O = \begin{pmatrix}H\\HF\\\vdots\\HF^{n-1}\end{pmatrix}\ \text{has rank } n$$
<p>For the constant-velocity model: $H=(1\ 0)$, $HF = (1\ T)$, rank 2 ✓. Velocity is observable from position. But with only velocity measured, the absolute position is <b>not</b> observable, and its variance grows without bound.</p>
<p>The steady-state constant-velocity Kalman filter is the classic <b>α–β filter</b>:</p>
$$\hat p_k = \hat p_k^- + \alpha(z_k - \hat p_k^-),\qquad \hat v_k = \hat v_k^- + \frac{\beta}{T}(z_k - \hat p_k^-)$$
<p>with optimal gains linked by the tracking index. A common relation is $\beta = \dfrac{\alpha^2}{2-\alpha}$. It is widely used in radar and embedded tracking because it needs no matrices at run time.</p>`,
      formulas: [{ name: "Observability matrix", tex: R`\mathcal O=[H;\,HF;\,\dots;\,HF^{n-1}],\ \mathrm{rank}=n` }, { name: "α–β filter", tex: R`\hat p=\hat p^-+\alpha\nu,\ \ \hat v=\hat v^-+\tfrac{\beta}{T}\nu` }, { name: "Optimal relation", tex: R`\beta=\dfrac{\alpha^2}{2-\alpha}` }],
      quiz: [
        { q: "If only velocity is measured, the absolute position is…", options: ["Observable", "Not observable", "Exactly known", "Zero"], a: 1, why: "Adding a constant to position does not change the measurements." },
        { q: "The α–β filter is the steady-state form of…", options: ["The particle filter", "The constant-velocity Kalman filter", "PID", "The UKF"], a: 1, why: "Fixed gains on position and velocity." }
      ] }
  ] });

MODULES.push({ id: "m5", title: "Kalman Filters in Practice", icon: "🔧",
  intro: "Checking that a filter works, tuning it, keeping it numerically healthy, and handling bad data.",
  lessons: [
    { id: "m5l1", title: "Innovations and consistency",
      body: R`<p>You rarely know the true state, but you always see the <b>innovation</b></p>
$$\boldsymbol\nu_k = \mathbf z_k - H\hat{\mathbf x}_k^-,\qquad S_k = HP_k^-H^\top + R$$
<p>For a well-tuned filter, innovations are <b>zero-mean</b>, <b>white</b> (uncorrelated in time) and have covariance $S_k$. A quantitative check is the <b>normalized innovation squared (NIS)</b>:</p>
$$\epsilon_k = \boldsymbol\nu_k^\top S_k^{-1}\boldsymbol\nu_k\ \sim\ \chi^2_m$$
<p>whose average should be close to $m$ (the number of measurements).</p>
<table class="tbl"><tr><th>Average NIS</th><th>Diagnosis</th></tr>
<tr><td>≈ m</td><td>Consistent</td></tr>
<tr><td>≫ m</td><td>Filter overconfident: Q or R too small, or model error</td></tr>
<tr><td>≪ m</td><td>Filter too pessimistic: Q or R too large</td></tr></table>
<p>In simulation, where the truth is known, the <b>NEES</b> $(\mathbf x-\hat{\mathbf x})^\top P^{-1}(\mathbf x-\hat{\mathbf x})$ should average $n$.</p>`,
      formulas: [{ name: "Innovation", tex: R`\boldsymbol\nu_k=\mathbf z_k-H\hat{\mathbf x}_k^-` }, { name: "NIS", tex: R`\epsilon_k=\boldsymbol\nu_k^\top S_k^{-1}\boldsymbol\nu_k\sim\chi^2_m` }, { name: "NEES", tex: R`(\mathbf x-\hat{\mathbf x})^\top P^{-1}(\mathbf x-\hat{\mathbf x})\sim\chi^2_n` }],
      quiz: [
        { q: "For a 1D measurement, a consistent filter's average NIS is about…", options: ["0", "1", "10", "m²"], a: 1, why: R`$E[\chi^2_1]=1$.` },
        { q: "Average NIS = 15 for a scalar measurement suggests…", options: ["A well-tuned filter", "An overconfident filter (Q or R too small)", "A pessimistic filter", "Perfect sensors"], a: 1, why: "Innovations are much larger than the filter expects." }
      ] },
    { id: "m5l2", title: "Tuning methods",
      body: R`<table class="tbl"><tr><th>Method</th><th>How</th></tr>
<tr><td>R from data</td><td>Record the sensor on a constant input; the sample variance is R</td></tr>
<tr><td>Q from physics</td><td>Bound the unmodelled acceleration or disturbance, e.g. $q \approx a_{\max}^2 T$</td></tr>
<tr><td>Manual tuning</td><td>Increase Q until lag disappears, without excessive noise</td></tr>
<tr><td>Innovation-based</td><td>Adjust Q, R until NIS averages m and innovations are white</td></tr>
<tr><td>Maximum likelihood / EM</td><td>Choose Q, R maximizing $\sum\log\mathcal N(\nu_k;0,S_k)$ over logged data</td></tr>
<tr><td>Adaptive filtering</td><td>Estimate R or Q online from innovation statistics</td></tr></table>
<p>The log-likelihood used for automatic tuning:</p>
$$\ln L = -\frac12\sum_k\Big(\ln\det(2\pi S_k) + \boldsymbol\nu_k^\top S_k^{-1}\boldsymbol\nu_k\Big)$$
<p>Practical tip: tune on recorded data offline, replaying the same log while changing parameters, so comparisons are fair.</p>`,
      formulas: [{ name: "Innovation log-likelihood", tex: R`\ln L=-\tfrac12\sum_k(\ln\det(2\pi S_k)+\nu_k^\top S_k^{-1}\nu_k)` }],
      quiz: [
        { q: "The simplest way to obtain R is…", options: ["Guess", "Measure the sensor's variance on a constant signal", "Set R = Q", "Use F"], a: 1, why: "Sensor noise statistics can be measured directly." },
        { q: "Maximum-likelihood tuning chooses Q and R to…", options: ["Minimize the gain", "Maximize the likelihood of the observed innovations", "Make P zero", "Speed up computation"], a: 1, why: "It uses the innovation log-likelihood." }
      ] },
    { id: "m5l3", title: "Numerical health",
      body: R`<p>Rounding errors can make $P$ lose symmetry or positive definiteness, after which the filter can diverge. Remedies:</p>
<table class="tbl"><tr><th>Technique</th><th>Idea</th></tr>
<tr><td>Joseph form</td><td>A covariance update that stays symmetric and positive definite for any gain</td></tr>
<tr><td>Symmetrize</td><td>After each step: $P \leftarrow \tfrac12(P+P^\top)$</td></tr>
<tr><td>Square-root filters</td><td>Propagate $P^{1/2}$ (Cholesky factor); doubles numerical precision</td></tr>
<tr><td>UD factorization (Bierman)</td><td>$P = UDU^\top$; classic for embedded and aerospace</td></tr>
<tr><td>Sequential updates</td><td>Process measurements one at a time (if R is diagonal), so no matrix inverse is needed</td></tr></table>
<p>The Joseph form:</p>
$$P_k = (I-K_kH)P_k^-(I-K_kH)^\top + K_kRK_k^\top$$
<p>Use it whenever you implement in single precision (common on microcontrollers) or the gain is not exactly optimal.</p>`,
      formulas: [{ name: "Joseph form", tex: R`P_k=(I-K_kH)P_k^-(I-K_kH)^\top+K_kRK_k^\top` }, { name: "Symmetrization", tex: R`P\leftarrow\tfrac12(P+P^\top)` }],
      quiz: [
        { q: "Why use the Joseph form?", options: ["It is faster", "It keeps P symmetric and positive definite despite rounding", "It removes noise", "It avoids prediction"], a: 1, why: "It is numerically robust." },
        { q: "Sequential processing of measurements avoids…", options: ["Prediction", "Matrix inversion", "Noise", "The gain"], a: 1, why: "Each scalar update needs only a division." }
      ] },
    { id: "m5l4", title: "Missing data and outliers",
      body: R`<p><b>Missing measurements:</b> just skip the update and keep predicting. $P$ grows, and the filter automatically trusts the next measurement more. <b>Multi-rate sensors</b> (GPS at 1 Hz, IMU at 100 Hz) are handled the same way: predict at the fast rate, update whenever a measurement arrives.</p>
<p><b>Outliers</b> (a GPS jump, a glitch) can drag the estimate far off. Use <b>validation gating</b>: accept a measurement only if its NIS is plausible:</p>
$$\boldsymbol\nu_k^\top S_k^{-1}\boldsymbol\nu_k \le \gamma$$
<p>where γ is a $\chi^2_m$ threshold, for example:</p>
<table class="tbl"><tr><th>m</th><th>γ (99% gate)</th></tr>
<tr><td>1</td><td>6.63</td></tr><tr><td>2</td><td>9.21</td></tr><tr><td>3</td><td>11.34</td></tr></table>
<p>The quantity $\sqrt{\boldsymbol\nu^\top S^{-1}\boldsymbol\nu}$ is the <b>Mahalanobis distance</b>, which measures surprise in units of standard deviations. Gating is also the first step in multi-target tracking (deciding which measurement belongs to which track).</p>
<p><b>Delayed measurements</b> (e.g. from slow image processing) can be fused by storing past states and re-running the filter from the time of the measurement.</p>`,
      formulas: [{ name: "Validation gate", tex: R`\nu_k^\top S_k^{-1}\nu_k\le\gamma` }, { name: "Mahalanobis distance", tex: R`d=\sqrt{\nu^\top S^{-1}\nu}` }],
      quiz: [
        { q: "When a measurement is missing, the filter should…", options: ["Stop", "Skip the update and keep predicting", "Set K = 1", "Reset P to zero"], a: 1, why: "Prediction continues; P grows." },
        { q: "A scalar innovation has ν = 6 and S = 4. Should it pass a 99% gate (γ = 6.63)?", options: ["Yes: NIS = 1.5", "No: NIS = 9 > 6.63", "No: NIS = 24", "Yes: NIS = 3"], a: 1, why: R`$6^2/4=9>6.63$, so reject it as an outlier.` }
      ] }
  ] });

MODULES.push({ id: "m6", title: "Nonlinear Filters", icon: "〰️",
  intro: "Extended, unscented and particle filters for systems that are not linear.",
  lessons: [
    { id: "m6l1", title: "The extended Kalman filter",
      body: R`<p>For nonlinear models</p>
$$\mathbf x_k = f(\mathbf x_{k-1},\mathbf u_{k-1}) + \mathbf w,\qquad \mathbf z_k = h(\mathbf x_k) + \mathbf v$$
<p>the <b>EKF</b> uses the nonlinear functions for the means and their <b>Jacobians</b> for the covariances:</p>
$$F_k = \frac{\partial f}{\partial \mathbf x}\Big|_{\hat{\mathbf x}_{k-1}},\qquad H_k = \frac{\partial h}{\partial \mathbf x}\Big|_{\hat{\mathbf x}_k^-}$$
$$\hat{\mathbf x}_k^- = f(\hat{\mathbf x}_{k-1},\mathbf u),\quad P_k^- = F_kP_{k-1}F_k^\top + Q,\quad \boldsymbol\nu = \mathbf z_k - h(\hat{\mathbf x}_k^-)$$
<p>and the rest as in the linear filter.</p>
<p><b>Example:</b> a radar measures range to a target at $(p_x,p_y)$:</p>
$$h(\mathbf x) = \sqrt{p_x^2+p_y^2},\qquad H = \left(\frac{p_x}{r},\ \frac{p_y}{r}\right)$$
<p>Strengths: simple and fast; the industry standard (GPS receivers, Apollo, SLAM). Weaknesses: Jacobians must be derived; strong nonlinearity or poor initial guesses can make it diverge.</p>`,
      formulas: [{ name: "EKF Jacobians", tex: R`F_k=\partial f/\partial\mathbf x,\ \ H_k=\partial h/\partial\mathbf x` }, { name: "Range Jacobian", tex: R`H=\big(p_x/r,\ p_y/r\big)` }],
      quiz: [
        { q: "The EKF propagates covariance using…", options: ["Sigma points", "Jacobians (linearization)", "Particles", "Nothing"], a: 1, why: "It linearizes around the current estimate." },
        { q: "A known EKF weakness is…", options: ["It needs no model", "It can diverge with strong nonlinearity or a bad initial guess", "It is always slower than a particle filter", "It cannot use matrices"], a: 1, why: "Linearization errors accumulate." }
      ] },
    { id: "m6l2", title: "The unscented Kalman filter",
      body: R`<p>Julier and Uhlmann (1997): “it is easier to approximate a probability distribution than a nonlinear function.” The <b>unscented transform</b> picks $2n+1$ <b>sigma points</b> that capture the mean and covariance exactly, passes each through the true nonlinear function, and recomputes mean and covariance from the results.</p>
$$\mathcal X_0 = \hat{\mathbf x},\qquad \mathcal X_{\pm i} = \hat{\mathbf x} \pm \Big(\sqrt{(n+\lambda)P}\Big)_i,\ \ i = 1..n$$
$$\lambda = \alpha^2(n+\kappa) - n$$
$$\hat{\mathbf y} = \sum_i W_i\, f(\mathcal X_i),\qquad P_y = \sum_i W_i\big(f(\mathcal X_i)-\hat{\mathbf y}\big)\big(f(\mathcal X_i)-\hat{\mathbf y}\big)^\top$$
<table class="tbl"><tr><th></th><th>EKF</th><th>UKF</th></tr>
<tr><td>Jacobians needed</td><td>Yes</td><td>No</td></tr>
<tr><td>Accuracy (mean)</td><td>1st order</td><td>2nd order (3rd for Gaussian)</td></tr>
<tr><td>Cost</td><td>Low</td><td>Similar order, about 2n+1 function evaluations</td></tr></table>`,
      formulas: [{ name: "Sigma points", tex: R`\mathcal X_{\pm i}=\hat{\mathbf x}\pm(\sqrt{(n+\lambda)P})_i` }, { name: "Scaling", tex: R`\lambda=\alpha^2(n+\kappa)-n` }, { name: "Unscented mean", tex: R`\hat{\mathbf y}=\sum_iW_if(\mathcal X_i)` }],
      quiz: [
        { q: "How many sigma points does a UKF use for n = 3 states?", options: ["3", "6", "7", "9"], a: 2, why: R`$2n+1=7$.` },
        { q: "The UKF's main practical advantage over the EKF is…", options: ["No Jacobians and better accuracy for strong nonlinearity", "Lower memory", "No model needed", "Exact for any system"], a: 0, why: "It propagates sigma points through the true function." }
      ] },
    { id: "m6l3", title: "The particle filter",
      body: R`<p>When the belief is <b>multimodal</b> (several possible locations) or the noise is not Gaussian, represent it by many weighted samples, called <b>particles</b>:</p>
<ol><li><b>Predict:</b> move every particle through the process model with random noise.</li>
<li><b>Weight:</b> multiply each weight by the likelihood of the measurement: $w^{(i)} \propto w^{(i)}\,p(z_k\mid x^{(i)})$.</li>
<li><b>Resample:</b> draw a new set, duplicating heavy particles and dropping light ones.</li></ol>
<p>Resample when the effective sample size gets low:</p>
$$N_{\text{eff}} = \frac{1}{\sum_i \big(w^{(i)}\big)^2} < \frac{N}{2}$$
<p>The simulator shows the classic <b>robot in a corridor</b>: the robot knows the map (where the doors are) but not where it is. At first, particles spread everywhere; each “door seen” or “wall seen” reading and each move sharpens the belief until it locks onto the true position.</p>`,
      widget: "pf", widgetOpts: {},
      formulas: [{ name: "Weight update", tex: R`w^{(i)}\propto w^{(i)}\,p(z_k|x^{(i)})` }, { name: "Effective sample size", tex: R`N_{\text{eff}}=1/\sum_i(w^{(i)})^2` }],
      quiz: [
        { q: "Particle filters are preferred when the belief is…", options: ["Gaussian and unimodal", "Multimodal or strongly non-Gaussian", "Exactly known", "Linear"], a: 1, why: "Particles can represent any shape." },
        { q: "Resampling…", options: ["Adds new sensors", "Duplicates high-weight particles and drops low-weight ones", "Sets all weights to zero", "Removes the model"], a: 1, why: "It focuses particles on likely regions." }
      ] },
    { id: "m6l4", title: "Choosing a filter",
      body: R`<table class="tbl"><tr><th>Situation</th><th>Recommended</th></tr>
<tr><td>Linear model, Gaussian noise</td><td>Kalman filter (optimal)</td></tr>
<tr><td>Mildly nonlinear, good initial guess</td><td>EKF</td></tr>
<tr><td>Strongly nonlinear, hard Jacobians</td><td>UKF</td></tr>
<tr><td>Multimodal beliefs, global localization, non-Gaussian noise</td><td>Particle filter</td></tr>
<tr><td>Very high dimension (weather: 10⁸ states)</td><td>Ensemble Kalman filter</td></tr>
<tr><td>Need the best estimate of the past</td><td>Smoother (RTS, Module 7)</td></tr></table>
<p>The <b>ensemble Kalman filter (EnKF)</b> represents P by an ensemble of perhaps 50–100 model runs, estimating covariances from their spread, which makes Kalman filtering possible for weather and ocean models with huge state vectors.</p>
$$P \approx \frac{1}{N-1}\sum_{i=1}^{N}(\mathbf x^{(i)}-\bar{\mathbf x})(\mathbf x^{(i)}-\bar{\mathbf x})^\top$$
<p>Rule of thumb: start with the simplest filter that might work (KF or EKF), check consistency (NIS), and move up only if needed.</p>`,
      formulas: [{ name: "Ensemble covariance", tex: R`P\approx\tfrac1{N-1}\sum_i(\mathbf x^{(i)}-\bar{\mathbf x})(\mathbf x^{(i)}-\bar{\mathbf x})^\top` }],
      quiz: [
        { q: "Weather prediction centres mostly use…", options: ["Particle filters with 10⁸ particles", "Ensemble Kalman filters or variational methods", "A scalar KF", "No filtering"], a: 1, why: "Ensembles approximate covariances for huge states." },
        { q: "A robot that must find itself anywhere on a map with repeated features needs…", options: ["A linear KF", "A particle filter (multimodal belief)", "An α–β filter", "No filter"], a: 1, why: "Several locations may look alike." }
      ] }
  ] });

MODULES.push({ id: "m7", title: "Sensor Fusion", icon: "📡",
  intro: "Combining gyros, accelerometers, GPS and more: complementary filters, INS/GNSS and smoothing.",
  lessons: [
    { id: "m7l1", title: "Inertial sensors and their errors",
      body: R`<p>An <b>IMU</b> combines gyroscopes (angular rate) and accelerometers (specific force), often with magnetometers. Their errors are complementary:</p>
<table class="tbl"><tr><th>Sensor</th><th>Good at</th><th>Problem</th></tr>
<tr><td>Gyroscope</td><td>Fast, smooth rotation changes</td><td><b>Bias</b>: integrating rate gives drifting angle</td></tr>
<tr><td>Accelerometer</td><td>Long-term tilt (gravity direction)</td><td>Noisy; disturbed by motion accelerations</td></tr>
<tr><td>Magnetometer</td><td>Heading (north)</td><td>Disturbed by nearby iron and currents</td></tr>
<tr><td>GPS</td><td>Absolute position, no drift</td><td>Slow (1–10 Hz), noisy, can drop out</td></tr></table>
<p>A gyro bias $b$ makes the integrated angle drift linearly:</p>
$$\theta_{gyro}(t) = \theta_0 + \int_0^t(\omega + b)\,d\tau = \theta_{true}(t) + b\,t$$
<p>A bias of just 0.5 °/s (common in cheap MEMS gyros) produces 30° of error per minute. Fusion is essential.</p>`,
      formulas: [{ name: "Gyro drift", tex: R`\theta_{gyro}(t)=\theta_{true}(t)+bt` }, { name: "Tilt from accelerometer", tex: R`\theta_{acc}=\operatorname{atan2}(a_x,a_z)` }],
      quiz: [
        { q: "A gyro bias of 0.1 °/s gives what angle error after 100 s?", options: ["0.1°", "1°", "10°", "100°"], a: 2, why: "0.1 × 100 = 10°." },
        { q: "Which sensor gives drift-free but noisy tilt?", options: ["Gyroscope", "Accelerometer", "GPS", "Barometer"], a: 1, why: "Gravity direction gives absolute tilt." }
      ] },
    { id: "m7l2", title: "The complementary filter",
      body: R`<p>The simplest fusion: <b>high-pass</b> the gyro angle (trust it short-term) and <b>low-pass</b> the accelerometer angle (trust it long-term):</p>
$$\hat\theta_k = \alpha\,\big(\hat\theta_{k-1} + \omega_k\,\Delta t\big) + (1-\alpha)\,\theta_{acc,k}$$
<p>The crossover time constant is</p>
$$\tau = \frac{\alpha\,\Delta t}{1-\alpha}$$
<p><b>Example:</b> $\alpha = 0.98$, $\Delta t = 0.01$ s gives $\tau \approx 0.49$ s: below about 2 Hz trust the accelerometer, above it trust the gyro.</p>
<p>In the frequency domain, the two weights add up to exactly 1 at every frequency, hence the name <b>complementary</b>:</p>
$$\hat\theta(s) = \frac{\tau s}{\tau s+1}\,\theta_{gyro}(s) + \frac{1}{\tau s+1}\,\theta_{acc}(s)$$
<p>It is a steady-state Kalman filter in disguise, used in countless drones, balancing robots and phone orientation code. Compare it with gyro-only and accelerometer-only estimates in the simulator.</p>`,
      widget: "comp", widgetOpts: {},
      formulas: [{ name: "Complementary filter", tex: R`\hat\theta_k=\alpha(\hat\theta_{k-1}+\omega_k\Delta t)+(1-\alpha)\theta_{acc,k}` }, { name: "Time constant", tex: R`\tau=\dfrac{\alpha\Delta t}{1-\alpha}` }],
      quiz: [
        { q: "With α = 0.99 and Δt = 0.01 s, τ is about…", options: ["0.01 s", "0.1 s", "0.99 s", "10 s"], a: 2, why: "0.0099 / 0.01 = 0.99 s." },
        { q: "The complementary filter trusts the gyro at…", options: ["Low frequencies", "High frequencies", "All frequencies equally", "Never"], a: 1, why: "The gyro path is high-passed." }
      ] },
    { id: "m7l3", title: "GPS/INS integration",
      body: R`<p>Navigation systems combine a fast, smooth but drifting <b>inertial navigation system (INS)</b> with slow, noisy but drift-free <b>GNSS</b> (GPS, Galileo, BeiDou).</p>
<p>The standard approach is the <b>error-state (indirect) Kalman filter</b>: the INS integrates IMU data at high rate; the Kalman filter estimates the INS <b>errors</b> (position, velocity, attitude errors and sensor biases) using the GPS–INS difference as its measurement:</p>
$$\delta\mathbf z_k = \mathbf p_{GPS,k} - \mathbf p_{INS,k} = H\,\delta\mathbf x_k + \mathbf v_k$$
<p>and the corrections are fed back to the INS.</p>
<table class="tbl"><tr><th>Architecture</th><th>Measurement used</th><th>Pros</th></tr>
<tr><td>Loosely coupled</td><td>GPS position/velocity solution</td><td>Simple, modular</td></tr>
<tr><td>Tightly coupled</td><td>Raw pseudoranges</td><td>Works with fewer than 4 satellites</td></tr>
<tr><td>Ultra-tightly coupled</td><td>Inside the GPS tracking loops</td><td>Robust to jamming and dynamics</td></tr></table>
<p>Because biases are part of the error state, the filter <b>calibrates the IMU online</b>, so it coasts much better through tunnels or under bridges.</p>`,
      formulas: [{ name: "Error-state measurement", tex: R`\delta\mathbf z=\mathbf p_{GPS}-\mathbf p_{INS}=H\delta\mathbf x+\mathbf v` }],
      quiz: [
        { q: "In an error-state filter, the Kalman filter estimates…", options: ["The full state directly", "The INS errors (including sensor biases)", "Only GPS noise", "The map"], a: 1, why: "The INS carries the full state; the KF corrects its errors." },
        { q: "Tight coupling's main advantage is…", options: ["Simplicity", "It can use fewer than 4 satellites (raw pseudoranges)", "No IMU needed", "No computation"], a: 1, why: "Each pseudorange is a useful measurement on its own." }
      ] },
    { id: "m7l4", title: "Smoothing: looking back",
      body: R`<p>A filter estimates $\mathbf x_k$ from data <b>up to</b> time $k$. If you can wait (post-processing, offline analysis), a <b>smoother</b> uses <b>all</b> the data, before and after, for a better estimate.</p>
<p>The <b>Rauch–Tung–Striebel (RTS) smoother</b> runs the Kalman filter forward, then a backward pass:</p>
$$C_k = P_kF^\top\big(P_{k+1}^-\big)^{-1}$$
$$\hat{\mathbf x}_{k|N} = \hat{\mathbf x}_k + C_k\big(\hat{\mathbf x}_{k+1|N} - \hat{\mathbf x}_{k+1}^-\big)$$
$$P_{k|N} = P_k + C_k\big(P_{k+1|N} - P_{k+1}^-\big)C_k^\top$$
<p>The smoothed covariance is always smaller than or equal to the filtered one.</p>
<table class="tbl"><tr><th>Use case</th><th>Filter or smoother?</th></tr>
<tr><td>Real-time control</td><td>Filter</td></tr>
<tr><td>Survey and mapping from logged data</td><td>Smoother</td></tr>
<tr><td>Flight-test data analysis, sports tracking</td><td>Smoother</td></tr>
<tr><td>Economic time series (trend extraction)</td><td>Smoother</td></tr></table>`,
      formulas: [{ name: "RTS gain", tex: R`C_k=P_kF^\top(P_{k+1}^-)^{-1}` }, { name: "RTS state", tex: R`\hat{\mathbf x}_{k|N}=\hat{\mathbf x}_k+C_k(\hat{\mathbf x}_{k+1|N}-\hat{\mathbf x}^-_{k+1})` }],
      quiz: [
        { q: "A smoother differs from a filter because it uses…", options: ["Only past data", "Past and future data", "No data", "Only the model"], a: 1, why: "It processes the whole record." },
        { q: "For real-time drone control, you need a…", options: ["Smoother", "Filter", "Neither", "Both offline"], a: 1, why: "Future data is not available in real time." }
      ] }
  ] });

MODULES.push({ id: "m8", title: "Applications", icon: "🛰️",
  intro: "LQG control, battery state of charge, tracking, and estimation beyond engineering.",
  lessons: [
    { id: "m8l1", title: "LQG and the separation principle",
      body: R`<p>Combine a Kalman filter with an LQR controller using the estimated state:</p>
$$u_k = -K_{LQR}\,\hat{\mathbf x}_k$$
<p>This is <b>Linear Quadratic Gaussian (LQG)</b> control. The <b>separation principle</b> says the closed-loop poles are the union of the controller poles and the estimator poles:</p>
$$\operatorname{eig}(A - BK_{LQR})\ \cup\ \operatorname{eig}(A - LC)$$
<p>where $L$ is the (steady-state) Kalman gain. So the controller and the filter can be designed independently, and the combination is optimal for the expected quadratic cost.</p>
<p>Two duality facts make life easy: the Kalman gain comes from a Riccati equation of the same form as LQR's, with $(A,B,Q,R)$ replaced by $(A^\top, C^\top, Q_w, R_v)$:</p>
$$K_{KF}\ \leftrightarrow\ K_{LQR}^\top\quad \text{via}\quad A\to A^\top,\ B\to C^\top$$
<p>Caveat: LQG has no guaranteed robustness margins (Doyle, 1978); check margins or use robust design (see <b>Robust &amp; Adaptive Steps</b>).</p>`,
      formulas: [{ name: "LQG control", tex: R`u_k=-K_{LQR}\hat{\mathbf x}_k` }, { name: "Separation principle", tex: R`\mathrm{eig}(A-BK)\cup\mathrm{eig}(A-LC)` }],
      quiz: [
        { q: "The separation principle lets us…", options: ["Ignore the model", "Design the estimator and the controller independently", "Skip the Kalman filter", "Use only PID"], a: 1, why: "Closed-loop poles split into the two sets." },
        { q: "Does LQG guarantee good robustness margins?", options: ["Yes, always ≥ 60°", "No"], a: 1, why: "Doyle showed there are no guaranteed margins." }
      ] },
    { id: "m8l2", title: "Battery state of charge",
      body: R`<p>Battery management systems in EVs, phones and solar storage must know the <b>state of charge (SOC)</b>, which cannot be measured directly.</p>
<table class="tbl"><tr><th>Method</th><th>Strength</th><th>Weakness</th></tr>
<tr><td>Coulomb counting</td><td>Smooth, fast</td><td>Drifts (current-sensor bias, unknown initial SOC)</td></tr>
<tr><td>Open-circuit voltage (OCV) lookup</td><td>Absolute</td><td>Needs long rest; voltage sags under load</td></tr>
<tr><td>Kalman filter (EKF/UKF)</td><td>Combines both, online</td><td>Needs a battery model</td></tr></table>
<p>A common model: SOC dynamics from current $i$ (capacity $C_n$), plus an RC circuit for polarization, and a nonlinear voltage equation:</p>
$$SOC_{k+1} = SOC_k - \frac{\eta\,\Delta t}{C_n}\,i_k$$
$$v_k = OCV(SOC_k) - R_0\,i_k - v_{RC,k} + \text{noise}$$
<p>The EKF linearizes $OCV(SOC)$ (its slope $dOCV/dSOC$ gives $H$). It is the Kalman filter's version of “coulomb counting corrected by voltage”, with SOC errors typically held within a few percent.</p>`,
      formulas: [{ name: "Coulomb counting", tex: R`SOC_{k+1}=SOC_k-\dfrac{\eta\Delta t}{C_n}i_k` }, { name: "Terminal voltage model", tex: R`v_k=OCV(SOC_k)-R_0i_k-v_{RC,k}` }],
      quiz: [
        { q: "Why does pure coulomb counting drift?", options: ["Batteries are random", "Current-sensor bias and unknown initial SOC accumulate", "Voltage is too high", "It does not drift"], a: 1, why: "Integration accumulates errors." },
        { q: "In the SOC EKF, the measurement Jacobian H comes mainly from…", options: ["The capacity", "The slope of the OCV–SOC curve", "Temperature", "The sample time"], a: 1, why: R`$\partial v/\partial SOC=dOCV/dSOC$.` }
      ] },
    { id: "m8l3", title: "Beyond engineering",
      body: R`<table class="tbl"><tr><th>Field</th><th>Hidden state estimated</th><th>Measurements</th></tr>
<tr><td>Weather forecasting</td><td>Full atmospheric state</td><td>Stations, balloons, satellites (data assimilation)</td></tr>
<tr><td>Economics</td><td>Underlying trend, natural rate of unemployment, output gap</td><td>GDP, prices, employment data</td></tr>
<tr><td>Finance</td><td>Time-varying beta, volatility</td><td>Asset returns</td></tr>
<tr><td>Tourism and demand forecasting</td><td>Level, trend and seasonal components</td><td>Monthly arrivals, occupancy (structural time-series models)</td></tr>
<tr><td>Epidemiology</td><td>Infections, reproduction number R<sub>t</sub></td><td>Reported cases, hospitalizations</td></tr>
<tr><td>Medicine</td><td>Blood glucose (CGM sensors), heart rate</td><td>Noisy sensors</td></tr>
<tr><td>Robotics, vision</td><td>Pose and map (SLAM)</td><td>Cameras, lidar</td></tr></table>
<p>A <b>local linear trend</b> model, popular for forecasting, is just a Kalman filter:</p>
$$y_t = \mu_t + \varepsilon_t,\qquad \mu_{t+1} = \mu_t + \beta_t + \eta_t,\qquad \beta_{t+1} = \beta_t + \zeta_t$$
<p>Add a seasonal state for monthly or quarterly patterns, and the filter separates trend, season and noise, handling missing months naturally.</p>`,
      formulas: [{ name: "Local linear trend model", tex: R`y_t=\mu_t+\varepsilon_t,\ \mu_{t+1}=\mu_t+\beta_t+\eta_t,\ \beta_{t+1}=\beta_t+\zeta_t` }],
      quiz: [
        { q: "In the local linear trend model, β is the…", options: ["Noise", "Slope (growth rate) of the trend", "Seasonal effect", "Measurement"], a: 1, why: R`$\mu$ grows by $\beta$ each period.` },
        { q: "Weather data assimilation estimates…", options: ["Only temperature at one station", "The full atmospheric state from many observations", "Nothing", "Only rainfall"], a: 1, why: "It fuses diverse observations into model states." }
      ] },
    { id: "m8l4", title: "Review",
      body: R`<p>Well done! The whole course on one page:</p>
<table class="tbl"><tr><th>Topic</th><th>Key result</th><th>Module</th></tr>
<tr><td>Gaussians</td><td>$\mathcal N(\mu,\sigma^2)$; $A\mathbf x+\mathbf b\Rightarrow APA^\top$</td><td>1</td></tr>
<tr><td>Fusion</td><td>$\sigma^2=\sigma_1^2\sigma_2^2/(\sigma_1^2+\sigma_2^2)$</td><td>2</td></tr>
<tr><td>1D KF</td><td>$K=P^-/(P^-+R)$; tune Q/R</td><td>3</td></tr>
<tr><td>Multivariate KF</td><td>Predict: $FPF^\top+Q$; update: $K=P^-H^\top S^{-1}$</td><td>4</td></tr>
<tr><td>Practice</td><td>NIS ≈ m; Joseph form; gating</td><td>5</td></tr>
<tr><td>Nonlinear</td><td>EKF (Jacobians), UKF (sigma points), PF (particles)</td><td>6</td></tr>
<tr><td>Sensor fusion</td><td>Complementary filter; GPS/INS error state; RTS smoother</td><td>7</td></tr>
<tr><td>Applications</td><td>LQG separation; SOC; trend models</td><td>8</td></tr></table>
<p><b>Next steps:</b> log the IMU of your Fold6 (many free apps export accelerometer and gyro data), and implement a complementary filter and a 2-state Kalman filter (angle + gyro bias). Then try the thermal plant on your Control Systems board with a noisy sensor.</p>
<p class="tip">Reading: Simon, <i>Optimal State Estimation</i>; Bar-Shalom, Li &amp; Kirubarajan, <i>Estimation with Applications to Tracking and Navigation</i>; Särkkä, <i>Bayesian Filtering and Smoothing</i> (free online); Labbe, <i>Kalman and Bayesian Filters in Python</i> (free online).</p>`,
      formulas: [],
      quiz: [
        { q: "Which equation propagates covariance in the prediction step?", options: [R`$P^-=FPF^\top+Q$`, R`$P=(I-KH)P^-$`, R`$K=P^-H^\top S^{-1}$`, R`$S=HP^-H^\top+R$`], a: 0, why: "Linear transformation plus process noise." },
        { q: "To localize a robot with several similar-looking places, use…", options: ["A Kalman filter", "A particle filter", "Least squares only", "A smoother"], a: 1, why: "The belief is multimodal." },
        { q: "A 2-state filter for angle + gyro bias mainly fixes…", options: ["Accelerometer noise only", "Gyro drift", "GPS dropouts", "Battery SOC"], a: 1, why: "The bias state is estimated and removed." }
      ] }
  ] });
