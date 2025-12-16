document.addEventListener("DOMContentLoaded", function() {
    const btnCalcular = document.querySelector(".btn-calculate");
    const btnLimpar = document.querySelector(".btn-clean");
    const resultadoContainer = document.getElementById("resultado-container");
    
    document.getElementById("current-year").textContent = new Date().getFullYear();
    
    const calcularINSS = (salario) => {
        if (salario <= 1412.00) return salario * 0.075;
        if (salario <= 2666.68) return 1412.00 * 0.075 + (salario - 1412.00) * 0.09;
        if (salario <= 4000.03) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (salario - 2666.68) * 0.12;
        if (salario <= 7786.02) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (salario - 4000.03) * 0.14;
        return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14;
    };
    
    const calcularIRRF = (salarioBase, numDependentes) => {
        const deducaoDependentes = numDependentes * 189.59;
        const baseCalculo = Math.max(0, salarioBase - deducaoDependentes);
        
        if (baseCalculo <= 2259.20) return 0;
        if (baseCalculo <= 2826.65) return (baseCalculo * 0.075) - 169.44;
        if (baseCalculo <= 3751.05) return (baseCalculo * 0.15) - 381.44;
        if (baseCalculo <= 4664.68) return (baseCalculo * 0.225) - 662.77;
        return (baseCalculo * 0.275) - 896.00;
    };
    
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    
    const calcularTempoTrabalhado = (dataAdmissao, dataDemissao) => {
        let anos = dataDemissao.getFullYear() - dataAdmissao.getFullYear();
        let meses = dataDemissao.getMonth() - dataAdmissao.getMonth();
        let dias = dataDemissao.getDate() - dataAdmissao.getDate();
        
        if (dias < 0) {
            meses--;
            const ultimoDiaMesAnterior = new Date(dataDemissao.getFullYear(), dataDemissao.getMonth(), 0).getDate();
            dias += ultimoDiaMesAnterior;
        }
        
        if (meses < 0) {
            anos--;
            meses += 12;
        }
        
        const totalMeses = anos * 12 + meses;
        
        return {
            anos,
            meses,
            dias,
            totalMeses,
            texto: `${anos > 0 ? anos + ' ano' + (anos !== 1 ? 's' : '') + ', ' : ''}${meses} mês${meses !== 1 ? 'es' : ''} e ${dias} dia${dias !== 1 ? 's' : ''}`
        };
    };
    
    const calcularRescisao = () => {
        const salario = parseFloat(document.getElementById("salario").value) || 0;
        const dataAdmissaoInput = document.getElementById("dataAdmissao").value;
        const dataDemissaoInput = document.getElementById("dataDemissao").value;
        const motivo = document.getElementById("motivo").value;
        const avisoPrevio = document.getElementById("avisoPrevio").value;
        const dependentes = parseInt(document.getElementById("dependentes").value) || 0;
        const feriasVencidas = document.getElementById("feriasVencidas").value;
        const diasFeriasInformados = parseInt(document.getElementById("feriasProporcionais").value) || 0;
        
        if (salario <= 0) {
            alert("Por favor, insira um salário bruto válido.");
            return null;
        }
        
        if (!dataAdmissaoInput || !dataDemissaoInput) {
            alert("Por favor, preencha as datas de admissão e demissão.");
            return null;
        }
        
        const dataAdmissao = new Date(dataAdmissaoInput + "T00:00:00");
        const dataDemissao = new Date(dataDemissaoInput + "T00:00:00");
        
        if (dataDemissao <= dataAdmissao) {
            alert("A data de demissão deve ser posterior à data de admissão.");
            return null;
        }
        
        const tempoTrabalhado = calcularTempoTrabalhado(dataAdmissao, dataDemissao);
        const salarioDia = salario / 30;
        const diasTrabalhadosMes = dataDemissao.getDate();
        const saldoSalario = salarioDia * diasTrabalhadosMes;
        
        let feriasProporcionais = 0;
        if (diasFeriasInformados > 0) {
            feriasProporcionais = (salario / 30) * diasFeriasInformados;
        } else {
            feriasProporcionais = (salario / 12) * tempoTrabalhado.meses;
        }
        
        let feriasVencidasValor = 0;
        const temDireitoFeriasVencidas = tempoTrabalhado.totalMeses >= 12;
        
        if (feriasVencidas === "sim" && temDireitoFeriasVencidas) {
            feriasVencidasValor = salario;
        }
        
        const totalFerias = feriasProporcionais + feriasVencidasValor;
        const tercoFerias = totalFerias / 3;
        const decimoTerceiroProporcional = (salario / 12) * tempoTrabalhado.meses;
        
        let avisoPrevioValor = 0;
        let temDireitoAvisoPrevio = false;
        
        if (motivo === "semJustaCausa" || motivo === "pedidoDemissao") {
            temDireitoAvisoPrevio = true;
        }
        
        if (temDireitoAvisoPrevio && (avisoPrevio === "indenizado" || avisoPrevio === "dispensado")) {
            avisoPrevioValor = salario;
        }
        
        const totalVerbas = saldoSalario + feriasProporcionais + feriasVencidasValor + 
                           tercoFerias + decimoTerceiroProporcional + avisoPrevioValor;
        
        const inssSaldo = calcularINSS(saldoSalario);
        const inss13 = calcularINSS(decimoTerceiroProporcional);
        const inssAvisoPrevio = calcularINSS(avisoPrevioValor);
        const totalINSS = inssSaldo + inss13 + inssAvisoPrevio;
        
        const baseIRRF = saldoSalario + decimoTerceiroProporcional + avisoPrevioValor;
        const baseCalculoIRRF = Math.max(0, baseIRRF - totalINSS);
        const irrf = calcularIRRF(baseCalculoIRRF, dependentes);
        
        const totalDeducoes = totalINSS + irrf;
        
        const fgtsDepositado = salario * 0.08 * tempoTrabalhado.totalMeses;
        const fgtsSaldoSalario = saldoSalario * 0.08;
        const fgtsDecimoTerceiro = decimoTerceiroProporcional * 0.08;
        const fgtsAvisoPrevio = avisoPrevioValor * 0.08;
        
        const totalFGTSAntesMulta = fgtsDepositado + fgtsSaldoSalario + fgtsDecimoTerceiro + fgtsAvisoPrevio;
        
        let multa40 = 0;
        let temDireitoMultaFGTS = false;
        let temDireitoSaqueFGTS = false;
        let mensagemFGTS = "";
        
        if (motivo === "semJustaCausa") {
            multa40 = totalFGTSAntesMulta * 0.4;
            temDireitoMultaFGTS = true;
            temDireitoSaqueFGTS = true;
            mensagemFGTS = "Direito à multa de 40% e saque total do FGTS.";
        } else if (motivo === "comJustaCausa") {
            mensagemFGTS = "Não tem direito à multa de 40% nem ao saque imediato do FGTS.";
        } else {
            mensagemFGTS = "Não tem direito à multa de 40%. Saque apenas em situações específicas.";
        }
        
        const totalFGTS = temDireitoMultaFGTS ? totalFGTSAntesMulta + multa40 : totalFGTSAntesMulta;
        const totalReceber = totalVerbas - totalDeducoes;
        
        return {
            salario,
            tempoTrabalhado,
            motivo,
            dependentes,
            verbas: {
                saldoSalario,
                feriasProporcionais,
                feriasVencidas: feriasVencidasValor,
                tercoFerias,
                decimoTerceiroProporcional,
                avisoPrevio: avisoPrevioValor,
                temDireitoAvisoPrevio,
                temDireitoFeriasVencidas
            },
            deducoes: {
                inssSaldo,
                inss13,
                inssAvisoPrevio,
                irrf,
                totalINSS
            },
            fgts: {
                depositado: fgtsDepositado,
                saldoSalario: fgtsSaldoSalario,
                decimoTerceiro: fgtsDecimoTerceiro,
                avisoPrevio: fgtsAvisoPrevio,
                multa40,
                total: totalFGTS,
                temDireitoMulta: temDireitoMultaFGTS,
                temDireitoSaque: temDireitoSaqueFGTS,
                mensagem: mensagemFGTS
            },
            totais: {
                verbas: totalVerbas,
                deducoes: totalDeducoes,
                fgts: totalFGTS,
                receber: totalReceber
            },
            salarioDia,
            diasFeriasInformados,
            marcouFeriasVencidas: feriasVencidas === "sim"
        };
    };
    
    const atualizarResultados = (resultado) => {
        if (!resultado) return;
        
        const arredondar = (valor) => Math.round(valor * 100) / 100;
        
        const verbasTotal = arredondar(resultado.totais.verbas);
        const deducoesTotal = arredondar(resultado.totais.deducoes);
        const fgtsTotal = arredondar(resultado.totais.fgts);
        const totalReceber = arredondar(verbasTotal - deducoesTotal);
        
        document.getElementById("resultado-verbas").textContent = formatarMoeda(verbasTotal);
        document.getElementById("resultado-deducoes").textContent = formatarMoeda(deducoesTotal);
        document.getElementById("resultado-total").textContent = formatarMoeda(totalReceber);
        
        const resultadoFgtsElement = document.getElementById("resultado-fgts");
        if (resultado.fgts.temDireitoSaque) {
            resultadoFgtsElement.textContent = formatarMoeda(fgtsTotal);
            resultadoFgtsElement.className = "";
        } else {
            resultadoFgtsElement.textContent = "Sem direito ao saque";
            resultadoFgtsElement.className = "sem-direito";
        }
        
        const detalheVerbas = document.getElementById("detalhe-verbas");
        
        let alertaFeriasHTML = "";
        if (resultado.marcouFeriasVencidas && !resultado.verbas.temDireitoFeriasVencidas) {
            alertaFeriasHTML = `
                <div class="alerta-ferias">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Atenção:</strong> Com ${resultado.tempoTrabalhado.meses} meses trabalhados, 
                    você não tem direito a férias vencidas. Para ter férias vencidas é necessário ter 
                    pelo menos 12 meses completos de trabalho. Serão calculadas apenas as férias proporcionais.
                </div>
            `;
        }
        
        let avisoPrevioHTML = "";
        if (resultado.verbas.avisoPrevio > 0) {
            const tipo = document.getElementById("avisoPrevio").value === "indenizado" ? "Indenizado" : "Dispensado";
            avisoPrevioHTML = `
                <div class="detalhe-item">
                    Aviso Prévio ${tipo} (30 dias):
                    <span>${formatarMoeda(arredondar(resultado.verbas.avisoPrevio))}</span>
                </div>
            `;
        }
        
        const diasFeriasCalculados = resultado.verbas.feriasProporcionais / (resultado.salario / 30);
        const textoDiasFerias = resultado.diasFeriasInformados > 0 ? 
            `${resultado.diasFeriasInformados} dias informados` : 
            `${diasFeriasCalculados.toFixed(1)} dias (${resultado.tempoTrabalhado.meses} meses × 2,5 dias/mês)`;
        
        detalheVerbas.innerHTML = `
            ${alertaFeriasHTML}
            <div class="detalhe-item">
                Saldo de Salário (${resultado.tempoTrabalhado.dias} dias):
                <span>${formatarMoeda(arredondar(resultado.verbas.saldoSalario))}</span>
            </div>
            <div class="detalhe-item">
                Férias Proporcionais (${textoDiasFerias}):
                <span>${formatarMoeda(arredondar(resultado.verbas.feriasProporcionais))}</span>
            </div>
            ${resultado.verbas.feriasVencidas > 0 ? `
            <div class="detalhe-item">
                Férias Vencidas (30 dias):
                <span>${formatarMoeda(arredondar(resultado.verbas.feriasVencidas))}</span>
            </div>
            ` : ''}
            <div class="detalhe-item">
                1/3 Constitucional das Férias:
                <span>${formatarMoeda(arredondar(resultado.verbas.tercoFerias))}</span>
            </div>
            <div class="detalhe-item">
                13º Salário Proporcional (${resultado.tempoTrabalhado.meses} meses):
                <span>${formatarMoeda(arredondar(resultado.verbas.decimoTerceiroProporcional))}</span>
            </div>
            ${avisoPrevioHTML}
            <div class="detalhe-item subtotal">
                <strong>TOTAL DAS VERBAS</strong>
                <strong>${formatarMoeda(verbasTotal)}</strong>
            </div>
        `;
        
        const detalheDeducoes = document.getElementById("detalhe-deducoes");
        const textoDependentes = resultado.dependentes > 0 ? 
            ` (com ${resultado.dependentes} dependente${resultado.dependentes !== 1 ? 's' : ''})` : '';
        
        let inssAvisoHTML = "";
        if (resultado.deducoes.inssAvisoPrevio > 0) {
            inssAvisoHTML = `
                <div class="detalhe-item">
                    INSS sobre Aviso Prévio:
                    <span>${formatarMoeda(arredondar(resultado.deducoes.inssAvisoPrevio))}</span>
                </div>
            `;
        }
        
        detalheDeducoes.innerHTML = `
            <div class="detalhe-item">
                INSS sobre Saldo de Salário:
                <span>${formatarMoeda(arredondar(resultado.deducoes.inssSaldo))}</span>
            </div>
            <div class="detalhe-item">
                INSS sobre 13º Salário:
                <span>${formatarMoeda(arredondar(resultado.deducoes.inss13))}</span>
            </div>
            ${inssAvisoHTML}
            ${resultado.deducoes.irrf > 0 ? `
            <div class="detalhe-item">
                IRRF${textoDependentes}:
                <span>${formatarMoeda(arredondar(resultado.deducoes.irrf))}</span>
            </div>
            ` : ''}
            <div class="detalhe-item subtotal">
                <strong>TOTAL DE DEDUÇÕES</strong>
                <strong>${formatarMoeda(deducoesTotal)}</strong>
            </div>
        `;
        
        const detalheFGTS = document.getElementById("detalhe-fgts");
        
        if (resultado.fgts.temDireitoSaque) {
            const subtotalFGTS = resultado.fgts.depositado + resultado.fgts.saldoSalario + 
                                resultado.fgts.decimoTerceiro + resultado.fgts.avisoPrevio;
            
            detalheFGTS.innerHTML = `
                <div class="fgts-item">
                    <div>
                        FGTS Depositado
                        <div class="fgts-descricao">${resultado.tempoTrabalhado.meses} meses × 8% do salário</div>
                    </div>
                    <span>${formatarMoeda(arredondar(resultado.fgts.depositado))}</span>
                </div>
                ${resultado.fgts.saldoSalario > 0 ? `
                <div class="fgts-item">
                    <div>Saldo de Salário</div>
                    <span>${formatarMoeda(arredondar(resultado.fgts.saldoSalario))}</span>
                </div>
                ` : ''}
                ${resultado.fgts.decimoTerceiro > 0 ? `
                <div class="fgts-item">
                    <div>13º Proporcional</div>
                    <span>${formatarMoeda(arredondar(resultado.fgts.decimoTerceiro))}</span>
                </div>
                ` : ''}
                ${resultado.fgts.avisoPrevio > 0 ? `
                <div class="fgts-item">
                    <div>Aviso Prévio</div>
                    <span>${formatarMoeda(arredondar(resultado.fgts.avisoPrevio))}</span>
                </div>
                ` : ''}
                <div class="fgts-item subtotal">
                    <strong>Subtotal FGTS</strong>
                    <strong>${formatarMoeda(arredondar(subtotalFGTS))}</strong>
                </div>
                <div class="fgts-item">
                    <div><strong>Multa de 40% sobre FGTS</strong></div>
                    <span><strong>${formatarMoeda(arredondar(resultado.fgts.multa40))}</strong></span>
                </div>
                <div class="fgts-item subtotal">
                    <strong>TOTAL PARA SAQUE</strong>
                    <strong>${formatarMoeda(fgtsTotal)}</strong>
                </div>
            `;
        } else {
            detalheFGTS.innerHTML = `
                <div class="alerta-fgts">
                    <i class="fas fa-info-circle"></i> 
                    <strong>${resultado.fgts.mensagem}</strong>
                </div>
            `;
        }
        
        resultadoContainer.style.display = "block";
        resultadoContainer.scrollIntoView({ behavior: 'smooth' });
    };
    
    btnCalcular.addEventListener("click", function() {
        const resultado = calcularRescisao();
        atualizarResultados(resultado);
    });
    
    btnLimpar.addEventListener("click", function() {
        document.getElementById("salario").value = "";
        document.getElementById("dataAdmissao").value = "";
        document.getElementById("dataDemissao").value = "";
        document.getElementById("motivo").value = "semJustaCausa";
        document.getElementById("avisoPrevio").value = "trabalhado";
        document.getElementById("dependentes").value = "0";
        document.getElementById("feriasVencidas").value = "nao";
        document.getElementById("feriasProporcionais").value = "0";
        
        document.getElementById("avisoPrevio").disabled = false;
        resultadoContainer.style.display = "none";
    });
    
    document.getElementById("motivo").addEventListener("change", function() {
        const motivo = this.value;
        const avisoPrevioSelect = document.getElementById("avisoPrevio");
        
        if (motivo === "semJustaCausa" || motivo === "pedidoDemissao") {
            avisoPrevioSelect.disabled = false;
        } else {
            avisoPrevioSelect.value = "trabalhado";
            avisoPrevioSelect.disabled = true;
        }
    });
    
    document.getElementById("salario").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            btnCalcular.click();
        }
    });
});