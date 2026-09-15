use honeytrace_engine::{correlate::CorrelationEngine, reconstruct::AttackReconstructor};
use honeytrace_engine::{
    correlate::UnimplementedCorrelation, reconstruct::UnimplementedReconstructor,
};

#[test]
fn puertos_de_algoritmo_no_se_presentan_como_implementados() {
    let correlation = UnimplementedCorrelation;
    assert!(correlation.correlate(&[]).is_err());

    let reconstruction = UnimplementedReconstructor;
    let group = honeytrace_engine::CorrelationGroup {
        correlation_id: "c-1".into(),
        event_ids: vec![],
        events: vec![],
    };
    assert!(reconstruction.reconstruct(&group).is_err());
}
