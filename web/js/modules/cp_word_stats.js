/*
 1. word frequency/frequency in context

- calculate word frequency 
*/
current_batch.viz = new CompassWordStats({
	root_el : $("#cp_mod_word_stats"),
	data: current_batch.get('data')
});