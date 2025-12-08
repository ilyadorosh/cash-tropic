\documentclass[10pt,a4paper]{altacv}

% Change the page layout if you need to
\geometry{left=1cm,right=9cm,marginparwidth=6.8cm,marginparsep=1.2cm,top=1cm,bottom=1cm}

% Change the font if you want to.

% If using pdflatex:
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[default]{lato}
\usepackage{url}
\usepackage{hyperref}

\usepackage{amsmath}

% If using xelatex or lualatex:
% \setmainfont{Lato}

% Change the colours if you want to
\definecolor{VividGreen}{HTML}{001E97}
\definecolor{SlateGrey}{HTML}{2E2E2E}
\definecolor{LightGrey}{HTML}{666666}
\definecolor{Vodafonered}{HTML}{d1ddd3}
\definecolor{Vodafonedark}{HTML}{59645a}
\colorlet{heading}{Vodafonered}
\colorlet{accent}{Vodafonedark}
\colorlet{emphasis}{SlateGrey}
\colorlet{body}{LightGrey}
\colorlet{href}{red}

% Change the bullets for itemize and rating marker
% for \cvskill if you want to
\renewcommand{\itemmarker}{{\small\textbullet}}
\renewcommand{\ratingmarker}{\faCircle}

%% sample.bib contains your publications
\addbibresource{sample.bib}

\begin{document}
\name{Illia Dorosh}
\tagline{Physics Simulation Engineer | AI Systems | Energy Research}
% Cropped to square from https://en.wikipedia.org/wiki/Marissa_Mayer#/media/File:Marissa_Mayer_May_2014_(cropped).jpg, CC-BY 2.0
\photo{6.5cm}{id.jpg}


%% Make the header extend all the way to the right, if you want.
% \begin{fullwidth}
% \end{fullwidth}

%% Depending on your tastes, you may want to make fonts of itemize environments slightly smaller
\AtBeginEnvironment{itemize}{\small}

%% Provide the file name containing the sidebar contents as an optional parameter to \cvsection.
%% You can always just use \marginpar{...} if you do
%% not need to align the top of the contents to any
%% \cvsection title in the "main" bar.




\cvsection{Vision}
\begin{quote}
"Blessed are the peacemakers." — Building systems that capture more energy for humanity.
\end{quote}

I am seeking to collaborate with leading physicists and engineers on massive energy capture and control systems — cryostats, advanced engines, and fusion technologies. My unique approach combines theoretical physics (entropic gravity, discrete spacetime) with practical real-time simulation, creating interactive educational tools that make complex physics intuitive.

\cvsection{Core Thesis: Entropic Gravity \& Energy Systems}

My research framework unifies several key concepts:
\begin{itemize}
\item \textbf{Gravity as Entropic Force:} Mass as positive potential energy, gravity as negative (compression). Following Verlinde's emergent gravity insights.
\item \textbf{Discrete Spacetime:} The universe as a cellular automaton with update rules based on temperature and potential energy gradients.
\item \textbf{EM Fields as Probability Shifts:} Electromagnetic interactions as probability distribution shifts within the discrete lattice.
\item \textbf{Energy Capture:} Understanding these fundamentals to engineer systems that capture and control more energy — the core of human progress.
\end{itemize}

\cvsection{Technical Portfolio: ActInLove Platform}

\cvevent{Physics-Informed Game Engine}{actinlove.com}{2023 -- Present}{Live Demo}
A full-stack interactive simulation platform demonstrating physics concepts:
\begin{itemize}
\item \textbf{4D Rendering Engine:} Real-time Lorentz transformations and 4D→3D projection (HyperMath.ts). Navigate spacetime warping at relativistic speeds.
\item \textbf{Neural Cellular Automata:} GPU-accelerated NCA simulations (app/nca) modeling self-organization and pattern formation.
\item \textbf{Educational Physics Missions:} Interactive lessons on entropy, energy conservation, compound interest (LearningJourney.ts, PhysicsMissions.ts).
\item \textbf{Discrete Spacetime Visualization:} Matrix-style buildings with cellular automata shaders (NeuralCity.ts).
\item \textbf{AI Integration:} GPT-4/Groq-powered NPCs that teach physics concepts through dialogue (AIAgentSystem.ts).
\end{itemize}

\textbf{Stack:} Next.js, TypeScript, Three.js, WebGL/GLSL, PostgreSQL, OpenAI API, Groq LPU

\cvsection{Technical Skills}

\cvskill{Physics Simulation}{Entropic Gravity, Lorentz Transformations, Cellular Automata, 4D Mathematics}
\cvskill{Real-Time Graphics}{Three.js, WebGL, GLSL Shaders, Custom Rendering Pipelines}
\cvskill{AI/ML Systems}{OpenAI API, Groq LPU, RAG, PyTorch, TensorFlow}
\cvskill{Full-Stack}{Next.js, React, TypeScript, Node.js, PostgreSQL, Linux}
\cvskill{Languages}{English (Fluent), German (C1), Ukrainian (Native), Russian (Native)}

\cvsection{Professional Experience}

\cvevent{Founder \& Lead Engineer}{ActInLove}{Aug 2023 -- Present}{Nuremberg, Germany}
\begin{itemize}
\item Built complete physics simulation platform from scratch — 4D engine, NCA, AI tutors.
\item Implemented real-time relativistic rendering with Lorentz transformations.
\item Deployed at actinlove.com — live, interactive physics education.
\item Participated in DreamDriven Accelerator (Zollhof, HackBay).
\end{itemize}

\divider

\cvevent{Research Engineer}{ReFace AI, Egora}{Aug 2019 -- Aug 2021}{Kyiv, Ukraine}
\begin{itemize}
\item Deep learning research: self-organization, pattern formation (Python, PyTorch).
\item WebGL/GLSL visualization development for complex systems.
\item Applied econophysics: statistical distributions to crypto-economic models.
\item Co-organized Stanford Biotechnology Group application workshop.
\end{itemize}

\divider

\cvevent{Web Developer}{Institute of Geochemistry, National Academy of Sciences}{Jul 2018 -- Aug 2019}{Kyiv, Ukraine}
\begin{itemize}
\item Maintained scientific journal website and user database.
\item Ensured ISBN compliance for scientific publications.
\end{itemize}

\cvsection{Education}

\cvevent{M.Sc. Biotechnology \& Bioengineering (interrupted)}{Taras Shevchenko National University}{Sept 2021 -- Feb 2022}{}
Studies interrupted by the war.

\cvevent{Guest Student, Technical Faculty}{Friedrich-Alexander-Universität Erlangen-Nürnberg}{Oct 2022 -- Aug 2023}{}

\cvevent{B.Sc. Systems Engineering}{KPI "Igor Sikorsky Kyiv Polytechnic Institute"}{Sept 2014 -- July 2018}{}

\cvevent{Applied Mathematics \& Systems Analysis (partial)}{KPI "Igor Sikorsky Kyiv Polytechnic Institute"}{Sept 2011 -- Dec 2012}{}
Key takeaway: \emph{reductio ad absurdum} — proof by contradiction.

\cvsection{Research Interests}

\begin{itemize}
\item \textbf{Energy Systems:} Cryostats, fusion control systems, massive energy capture.
\item \textbf{Theoretical Physics:} Second law of thermodynamics applied to economics, society, electronics, medicine.
\item \textbf{Biotechnology:} Viral vectors, gut microbiome engineering.
\item \textbf{Simulation:} Real-time physics engines for education and research.
\end{itemize}

\cvsection{Key Equations & Obsessions}

\textbf{The Fine Structure Constant} — the most mysterious number in physics:
$$\alpha = \frac{e^2}{4\pi\varepsilon_0\hbar c} \approx \frac{1}{137.036}$$

This dimensionless constant determines the strength of electromagnetic interaction. It connects:
\begin{itemize}
\item $e$ — electron charge (the quantum of EM coupling)
\item $\hbar$ — reduced Planck constant (quantum of action)
\item $c$ — speed of light (the speed limit of causality)
\item $\varepsilon_0$ — permittivity of free space
\end{itemize}

Why ~1/137? Nobody knows. Feynman called it "one of the greatest damn mysteries of physics." If $\alpha$ were slightly different, atoms wouldn't form, chemistry wouldn't exist, we wouldn't be here. My obsession: understanding why this number exists and what it tells us about the geometry of spacetime.

\textbf{Szilard's Insight (1929):} Information has thermodynamic cost. Erasing one bit requires:
$$E_{\text{min}} = k_B T \ln 2 \approx 3 \times 10^{-21} \text{ J at 310K}$$

This connects Shannon's information theory to thermodynamics — the bridge between computation and physics.

\textbf{Magnetism as Probability Shift:} EM fields are not "forces" in the classical sense. They shift probability distributions in the discrete spacetime lattice. What we perceive as magnetic force is the statistical tendency of particle states to align — entropy at work.

\textbf{The Speed of Light:} Not just a speed limit — it's the ratio of space to time in our universe:
$$c = \frac{\Delta x}{\Delta t} = 299,792,458 \text{ m/s}$$

In my simulations, I explore what happens when objects approach $c$ — the Lorentz factor $\gamma = 1/\sqrt{1-v^2/c^2}$ warps spacetime perception.

These principles guide my work on energy-efficient computation and entropy-aware system design.

\cvsection{Links}

\begin{itemize}
\item \textbf{Live Platform:} actinlove.com
\item \textbf{GitHub:} github.com/ilyadorosh
\item \textbf{Physics Demos:} actinlove.com/4d (4D spacetime), actinlove.com/nca (cellular automata), actinlove.com/tensor (relativistic rendering)
\end{itemize}

% \cvsection[page2sidebar]{Motivation}
% Sehr geehrter Herr Roland Heinz, 
% hiermit möchte ich als ProduktionsmitarbeiterHerr Roland Heinz bewerben.

% \section{What I bring}
% Moore's Law has guided the exponential growth of transistor density on integrated circuits for decades.

%  \begin{equation}
%      n_i = n_0 2^ { (y_i - y_0)/T_2}
%  \end{equation},  where $n_0$ is the number of transistors in some reference year, $y_0$, and $T_2 = 2$ is the number of years taken to double this number.

% \begin{equation}
%     E_{\text{min}} = k_{\text{B}} T \ln 2
% \end{equation}

% where:
% \begin{itemize}
%     \item $E_{\text{min}}$ is the minimum energy required to erase one bit of information,
%     \item $k_{\text{B}}$ is Boltzmann's constant ($1.380649 \times 10^{-23}~\text{J/K}$),
%     \item $T$ is the absolute temperature in Kelvin. $ T_{brain} \approx  310.2 °K $
% \end{itemize}

% \section*{Bitcoin Block Confirmation and Attacker Probability}

% % Introduce variables
% Let $q$ be the probability that an attacker finds the next block,
% $p = 1-q$ be the probability that the honest network finds the next block, and
% $z$ be the number of blocks by which the honest chain is ahead.

% % Probability that attacker catches up
% The probability that an attacker will ever catch up from $z$ blocks behind is given by
% \begin{equation}
% P = 
% \begin{cases}
% 1, & \text{if $q \ge p$} \\
% \left( \frac{q}{p} \right)^z, & \text{if $q < p$}
% \end{cases}
% \end{equation}

% % Poisson approximation for multiple blocks
% The more precise formulation uses a Poisson distribution:
% \begin{equation}
% \text{P(catch up)} = 1 - \sum_{k=0}^{z} \frac{\lambda^k e^{-\lambda}}{k!} 
% \left[1 - \left(\frac{q}{p}\right)^{z-k}\right], 
% \end{equation}
% where
% \begin{equation}
% \lambda = z \frac{q}{p}.
% \end{equation}

% \section*{Transformers}
% \begin{equation}
% Attention(Q, K, V) = softmax(\frac{QK^T}{\sqrt{d_k}})V
% \end{equation}

% Softmax
% \begin{equation}
% \sigma(z_i) = \frac{e^{z_{i}}}{\sum_{j=1}^K e^{z_{j}}} \ \ \ for\ i=1,2,\dots,K
% \end{equation}

% My goal here is to trace the energy flows in crystallization of matter through cross-entropy reduction.

%  \(\displaystyle \Delta E_{\text{Lamb}} \approx \frac{4\alpha^{5}}{3\pi} m_{e}c^{2}\ln\!\frac{1}{\alpha}\) 


% Then we plug in the energy probabilities.\


% LG, 

% Illia

Stand: \today

\end{document}
